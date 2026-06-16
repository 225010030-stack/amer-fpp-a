#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import subprocess
import uuid
import csv
import re
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Optional
from urllib.parse import unquote

from fastapi import FastAPI, File, Form, Header, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel


WORKSPACE_ROOT = Path(
    os.getenv("WORKSPACE_ROOT", str(Path(__file__).resolve().parents[1]))
).resolve()
JOBS_FILE = WORKSPACE_ROOT / "bot-gateway" / "jobs.json"
RUN_LOG_DIR = WORKSPACE_ROOT / "运行日志"
UPLOAD_INPUT_DIR = WORKSPACE_ROOT / "上传输入"
UPLOAD_OUTPUT_DIR = WORKSPACE_ROOT / "上传输出"
CONFIG_DIR = WORKSPACE_ROOT / "bot-gateway" / "config"
COMMAND_MAP_FILE = CONFIG_DIR / "command-map.json"
MENU_FILE = CONFIG_DIR / "menu.json"
BOT_GATEWAY_TOKEN = os.getenv("BOT_GATEWAY_TOKEN", "").strip()
SENSITIVE_COLUMNS = ["主体", "Requester", "Business Reviewer", "Department", "Center", "合同号", "Payment Description"]

ALLOWED_ACTIONS = {
    "run_agent_help": ["bash", "./knot-chat/run_agent.sh", "帮助"],
    "run_sop_menu": ["bash", "./knot-chat/run_sop_menu.sh"],
    "run_web_guide": ["bash", "./knot-chat/run_web_guide.sh"],
    "run_precheck": ["bash", "./knot-chat/run_precheck.sh"],
    "run_hc_check": ["bash", "./knot-chat/run_hc_check.sh"],
    "run_full_check": ["bash", "./knot-chat/run_full_check.sh"],
    "generate_submission_blocks": ["bash", "./knot-chat/generate_submission_blocks.sh"],
    "run_pain1_allocation": ["bash", "./knot-chat/run_pain1_allocation.sh"],
    "run_pain3_check_centers": ["bash", "./knot-chat/run_pain3_check_centers.sh"],
    "run_pain4_update_ledger": ["bash", "./knot-chat/run_pain4_update_ledger.sh"],
    "run_demo_us": ["bash", "./knot-chat/run_demo_us.sh"],
}

DEFAULT_COMMAND_MAP = {
    "帮助": "run_agent_help",
    "主菜单": "run_sop_menu",
    "菜单": "run_sop_menu",
    "sop": "run_sop_menu",
    "网页入口": "run_web_guide",
    "总检查": "run_full_check",
    "目录预检": "run_precheck",
    "预检": "run_precheck",
    "hc校验": "run_hc_check",
    "hc检查": "run_hc_check",
    "痛点1": "run_pain1_allocation",
    "自动分摊": "run_pain1_allocation",
    "分摊": "run_pain1_allocation",
    "痛点2": "generate_submission_blocks",
    "生成提单文本块": "generate_submission_blocks",
    "提单文本块": "generate_submission_blocks",
    "痛点3": "run_pain3_check_centers",
    "检查成本中心": "run_pain3_check_centers",
    "成本中心检查": "run_pain3_check_centers",
    "痛点4": "run_pain4_update_ledger",
    "台账更新": "run_pain4_update_ledger",
    "台账自动更新": "run_pain4_update_ledger",
    "us演示": "run_demo_us",
    "四痛点演示": "run_demo_us",
    "闭环演示": "run_demo_us",
}

app = FastAPI(title="FPP Bot Gateway", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    from wecom.router import router as wecom_router

    app.include_router(wecom_router, prefix="/api/wecom", tags=["wecom"])
except ImportError:
    wecom_router = None


class RunRequest(BaseModel):
    action: str
    root: Optional[str] = None
    months: Optional[str] = None


class WebhookResponse(BaseModel):
    ok: bool
    action: Optional[str] = None
    message: str
    data: Optional[dict[str, Any]] = None


def ensure_dirs() -> None:
    RUN_LOG_DIR.mkdir(parents=True, exist_ok=True)
    UPLOAD_INPUT_DIR.mkdir(parents=True, exist_ok=True)
    UPLOAD_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    JOBS_FILE.parent.mkdir(parents=True, exist_ok=True)
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)


def load_jobs() -> list[dict[str, Any]]:
    if not JOBS_FILE.exists():
        return []
    try:
        return json.loads(JOBS_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []


def save_jobs(jobs: list[dict[str, Any]]) -> None:
    JOBS_FILE.write_text(json.dumps(jobs, ensure_ascii=False, indent=2), encoding="utf-8")


def to_safe_abs(path_str: str) -> Path:
    p = Path(path_str).expanduser().resolve()
    if WORKSPACE_ROOT not in p.parents and p != WORKSPACE_ROOT:
        raise HTTPException(status_code=400, detail="Path is outside workspace root")
    return p


def load_command_map() -> dict[str, str]:
    if COMMAND_MAP_FILE.exists():
        try:
            data = json.loads(COMMAND_MAP_FILE.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                return {str(k).lower(): str(v) for k, v in data.items()}
        except json.JSONDecodeError:
            pass
    return dict(DEFAULT_COMMAND_MAP)


def extract_output_paths(stdout: str, root: Path) -> list[str]:
    outputs: list[str] = []
    for line in stdout.splitlines():
        txt = line.strip()
        if txt.startswith("DONE: "):
            candidate = txt.replace("DONE: ", "", 1).strip()
            p = Path(candidate).expanduser().resolve()
            if p.exists() and (root in p.parents or p == root):
                outputs.append(str(p))
    # de-duplicate while preserving order
    uniq: list[str] = []
    seen: set[str] = set()
    for p in outputs:
        if p not in seen:
            seen.add(p)
            uniq.append(p)
    return uniq


def to_bool(value: Optional[str], default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


def safe_alias(name: str) -> str:
    letters = re.sub(r"[^A-Za-z]", "", name or "")
    return (letters[:3].upper() or "COL")


def desensitize_csv(input_path: Path, region_tag: str) -> tuple[Path, dict[str, str], Path]:
    with input_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []
        rows = list(reader)
    if not fieldnames:
        return input_path, {}, input_path

    seq_by_col: dict[str, int] = {}
    val_to_token: dict[str, str] = {}
    token_to_val: dict[str, str] = {}
    masked_rows: list[dict[str, str]] = []

    for row in rows:
        fixed = dict(row)
        for col in SENSITIVE_COLUMNS:
            if col not in fieldnames:
                continue
            raw = (fixed.get(col) or "").strip()
            if not raw:
                continue
            key = f"{col}::{raw}"
            if key not in val_to_token:
                seq_by_col[col] = seq_by_col.get(col, 0) + 1
                token = f"{safe_alias(col)}_{seq_by_col[col]:03d}"
                val_to_token[key] = token
                token_to_val[token] = raw
            fixed[col] = val_to_token[key]
        masked_rows.append(fixed)

    now = datetime.now().strftime("%Y%m%d_%H%M%S")
    masked_path = UPLOAD_INPUT_DIR / f"{input_path.stem}_masked_{region_tag}_{now}.csv"
    with masked_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(masked_rows)

    map_path = UPLOAD_OUTPUT_DIR / f"脱敏映射_{region_tag}_{now}.json"
    map_path.write_text(
        json.dumps({"input": str(input_path), "masked": str(masked_path), "token_to_value": token_to_val}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return masked_path, token_to_val, map_path


def recover_output_text(path: Path, token_to_val: dict[str, str]) -> Optional[Path]:
    if not path.exists() or not path.is_file():
        return None
    if path.suffix.lower() not in {".md", ".csv", ".txt", ".json"}:
        return None
    try:
        content = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return None
    recovered = content
    for token, original in sorted(token_to_val.items(), key=lambda kv: len(kv[0]), reverse=True):
        recovered = recovered.replace(token, original)
    out_path = path.with_name(f"{path.stem}_恢复版{path.suffix}")
    out_path.write_text(recovered, encoding="utf-8")
    return out_path


def parse_text_from_payload(payload: dict[str, Any]) -> str:
    candidates = [
        payload.get("text"),
        payload.get("content"),
        payload.get("query"),
        payload.get("message"),
    ]
    for c in candidates:
        if isinstance(c, str) and c.strip():
            return c.strip()

    nested = payload.get("data")
    if isinstance(nested, dict):
        for k in ["text", "content", "query", "message"]:
            c = nested.get(k)
            if isinstance(c, str) and c.strip():
                return c.strip()
    return ""


def resolve_action_from_text(text: str) -> Optional[str]:
    if not text:
        return None
    lowered = text.lower()
    cmd_map = load_command_map()
    for keyword, action in cmd_map.items():
        if keyword in lowered:
            return action
    return None


def run_action(req: RunRequest) -> dict[str, Any]:
    ensure_dirs()
    if req.action not in ALLOWED_ACTIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported action: {req.action}")

    run_id = str(uuid.uuid4())
    started = datetime.now()
    cmd = list(ALLOWED_ACTIONS[req.action])

    # Optional parameter passthrough for precheck
    if req.action == "run_precheck" and req.months:
        cmd.extend(["--months", req.months.strip()])

    root = WORKSPACE_ROOT
    if req.root:
        root = to_safe_abs(req.root)

    result = subprocess.run(
        cmd,
        cwd=str(root),
        capture_output=True,
        text=True,
        check=False,
    )

    ended = datetime.now()
    elapsed_ms = int((ended - started).total_seconds() * 1000)
    ts = ended.strftime("%Y%m%d_%H%M%S")
    log_file = RUN_LOG_DIR / f"run_{req.action}_{ts}.md"
    log_file.write_text(
        "\n".join(
            [
                f"# Run Log: {req.action}",
                "",
                f"- run_id: `{run_id}`",
                f"- started_at: `{started.isoformat(timespec='seconds')}`",
                f"- ended_at: `{ended.isoformat(timespec='seconds')}`",
                f"- elapsed_ms: `{elapsed_ms}`",
                f"- exit_code: `{result.returncode}`",
                "",
                "## command",
                "```text",
                " ".join(cmd),
                "```",
                "",
                "## stdout",
                "```text",
                (result.stdout or "").rstrip(),
                "```",
                "",
                "## stderr",
                "```text",
                (result.stderr or "").rstrip(),
                "```",
            ]
        ),
        encoding="utf-8",
    )

    entry = {
        "ok": result.returncode == 0,
        "run_id": run_id,
        "action": req.action,
        "started_at": started.isoformat(timespec="seconds"),
        "elapsed_ms": elapsed_ms,
        "root": str(root),
        "exit_code": result.returncode,
        "log_file": str(log_file),
        "outputs": extract_output_paths(result.stdout or "", root),
        "stdout_tail": (result.stdout or "").splitlines()[-10:],
        "stderr_tail": (result.stderr or "").splitlines()[-10:],
    }
    jobs = load_jobs()
    jobs.append(entry)
    save_jobs(jobs[-100:])
    return entry


def run_cmd(cmd: list[str], cwd: Path, action: str, meta: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    ensure_dirs()
    run_id = str(uuid.uuid4())
    started = datetime.now()
    result = subprocess.run(cmd, cwd=str(cwd), capture_output=True, text=True, check=False)
    ended = datetime.now()
    elapsed_ms = int((ended - started).total_seconds() * 1000)
    ts = ended.strftime("%Y%m%d_%H%M%S")
    log_file = RUN_LOG_DIR / f"run_{action}_{ts}.md"
    log_file.write_text(
        "\n".join(
            [
                f"# Run Log: {action}",
                "",
                f"- run_id: `{run_id}`",
                f"- started_at: `{started.isoformat(timespec='seconds')}`",
                f"- ended_at: `{ended.isoformat(timespec='seconds')}`",
                f"- elapsed_ms: `{elapsed_ms}`",
                f"- exit_code: `{result.returncode}`",
                "",
                "## command",
                "```text",
                " ".join(cmd),
                "```",
                "",
                "## stdout",
                "```text",
                (result.stdout or "").rstrip(),
                "```",
                "",
                "## stderr",
                "```text",
                (result.stderr or "").rstrip(),
                "```",
            ]
        ),
        encoding="utf-8",
    )

    entry = {
        "ok": result.returncode == 0,
        "run_id": run_id,
        "action": action,
        "started_at": started.isoformat(timespec="seconds"),
        "elapsed_ms": elapsed_ms,
        "root": str(cwd),
        "exit_code": result.returncode,
        "log_file": str(log_file),
        "outputs": extract_output_paths(result.stdout or "", cwd),
        "stdout_tail": (result.stdout or "").splitlines()[-10:],
        "stderr_tail": (result.stderr or "").splitlines()[-10:],
    }
    if meta:
        entry.update(meta)
    jobs = load_jobs()
    jobs.append(entry)
    save_jobs(jobs[-100:])
    return entry


async def save_uploaded_file(file: UploadFile, prefix: str = "") -> Path:
    ensure_dirs()
    now = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = Path(file.filename or "input.csv").name
    name = f"{now}_{prefix}_{safe_name}" if prefix else f"{now}_{safe_name}"
    input_path = UPLOAD_INPUT_DIR / name
    content = await file.read()
    input_path.write_bytes(content)
    return input_path


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"ok": True, "service": "fpp-bot-gateway", "time": datetime.now().isoformat(timespec="seconds")}


@app.get("/api/meta")
def meta() -> dict[str, Any]:
    return {
        "ok": True,
        "workspace_root": str(WORKSPACE_ROOT),
        "actions": sorted(ALLOWED_ACTIONS.keys()),
    }


@app.get("/api/menu")
def menu_api() -> dict[str, Any]:
    if MENU_FILE.exists():
        return json.loads(MENU_FILE.read_text(encoding="utf-8"))
    return {"title": "AMER FPP", "items": [], "welcome": "menu.json not found"}


@app.post("/api/run")
def run(req: RunRequest) -> dict[str, Any]:
    return run_action(req)


@app.post("/api/upload-and-generate")
async def upload_and_generate(
    action: str = Form(...),
    file: UploadFile = File(...),
    root: str = Form(default=str(WORKSPACE_ROOT)),
    region: str = Form(default="US"),
    desensitize: Optional[str] = Form(default="false"),
    recover_output: Optional[str] = Form(default="true"),
) -> dict[str, Any]:
    target_root = to_safe_abs(root)
    input_path = await save_uploaded_file(file)
    now = datetime.now().strftime("%Y%m%d_%H%M%S")

    region_tag = (region or "US").strip().upper()
    do_desensitize = to_bool(desensitize, default=False)
    do_recover_output = to_bool(recover_output, default=True)
    effective_input = input_path
    token_map: dict[str, str] = {}
    map_path: Optional[Path] = None
    if do_desensitize:
        effective_input, token_map, map_path = desensitize_csv(input_path, region_tag)

    if action == "generate_submission_blocks":
        output_path = UPLOAD_OUTPUT_DIR / f"FPP提单文本块_{region_tag}_{now}.md"
        cmd = [
            "python3",
            str((WORKSPACE_ROOT / "generate_fpp_submission_blocks.py").resolve()),
            "--input",
            str(effective_input),
            "--output",
            str(output_path),
        ]
        result = run_cmd(
            cmd,
            target_root,
            "upload_generate_submission_blocks",
            meta={"region": region_tag, "step": "output"},
        )
        # append deterministic output path when script succeeded without DONE marker
        if result["ok"] and str(output_path) not in result["outputs"]:
            result["outputs"].append(str(output_path))
        if do_desensitize and map_path:
            result["desensitized"] = True
            result["mask_map"] = str(map_path)
            if str(map_path) not in result["outputs"]:
                result["outputs"].append(str(map_path))
            if do_recover_output and token_map:
                recovered = recover_output_text(output_path, token_map)
                if recovered and str(recovered) not in result["outputs"]:
                    result["outputs"].append(str(recovered))
        return result

    if action == "hc_check_upload":
        check_output = UPLOAD_OUTPUT_DIR / f"HC校验报告_{region_tag}_{now}.md"
        cmd = [
            "python3",
            str((WORKSPACE_ROOT / "check_hc_analysis.py").resolve()),
            "--file",
            str(effective_input),
        ]
        result = run_cmd(cmd, target_root, "upload_hc_check", meta={"region": region_tag, "step": "output"})
        report_lines = [
            "# HC 上传校验报告",
            "",
            f"- 输入文件：`{input_path}`",
            f"- 生成时间：`{datetime.now().isoformat(timespec='seconds')}`",
            f"- 执行状态：`{'成功' if result['ok'] else '失败'}`",
            "",
            "## 校验输出",
            "```text",
            "\n".join(result.get("stdout_tail", [])) or "(empty)",
            "```",
        ]
        check_output.write_text("\n".join(report_lines), encoding="utf-8")
        if str(check_output) not in result["outputs"]:
            result["outputs"].append(str(check_output))
        if do_desensitize and map_path:
            result["desensitized"] = True
            result["mask_map"] = str(map_path)
            if str(map_path) not in result["outputs"]:
                result["outputs"].append(str(map_path))
            if do_recover_output and token_map:
                recovered = recover_output_text(check_output, token_map)
                if recovered and str(recovered) not in result["outputs"]:
                    result["outputs"].append(str(recovered))
        return result

    if action == "doc_health_check_upload":
        check_output = UPLOAD_OUTPUT_DIR / f"提单文档字段健康检查报告_{region_tag}_{now}.md"
        cmd = [
            "python3",
            str((WORKSPACE_ROOT / "check_submission_doc_health.py").resolve()),
            "--input",
            str(effective_input),
            "--output",
            str(check_output),
        ]
        result = run_cmd(cmd, target_root, "upload_doc_health_check", meta={"region": region_tag, "step": "output"})
        if result["ok"] and str(check_output) not in result["outputs"]:
            result["outputs"].append(str(check_output))
        if do_desensitize and map_path:
            result["desensitized"] = True
            result["mask_map"] = str(map_path)
            if str(map_path) not in result["outputs"]:
                result["outputs"].append(str(map_path))
            if do_recover_output and token_map:
                recovered = recover_output_text(check_output, token_map)
                if recovered and str(recovered) not in result["outputs"]:
                    result["outputs"].append(str(recovered))
        return result

    if action == "stats_analysis_upload":
        report_path = UPLOAD_OUTPUT_DIR / f"统计提效分析报告_{region_tag}_{now}.md"
        risk_path = UPLOAD_OUTPUT_DIR / f"统计提效_风险评分明细_{region_tag}_{now}.csv"
        summary_path = UPLOAD_OUTPUT_DIR / f"统计提效_看板摘要_{region_tag}_{now}.json"
        cmd = [
            "python3",
            str((WORKSPACE_ROOT / "painpoint_stats_analyzer.py").resolve()),
            "--prefill",
            str(effective_input),
            "--jobs",
            str((WORKSPACE_ROOT / "bot-gateway" / "jobs.json").resolve()),
            "--report",
            str(report_path),
            "--risk-csv",
            str(risk_path),
            "--summary-json",
            str(summary_path),
        ]
        result = run_cmd(cmd, target_root, "upload_stats_analysis", meta={"region": region_tag, "step": "analytics"})
        for p in [report_path, risk_path, summary_path]:
            if result["ok"] and str(p) not in result["outputs"]:
                result["outputs"].append(str(p))
        if summary_path.exists():
            try:
                result["stats_summary"] = json.loads(summary_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                pass
        if do_desensitize and map_path:
            result["desensitized"] = True
            result["mask_map"] = str(map_path)
            if str(map_path) not in result["outputs"]:
                result["outputs"].append(str(map_path))
            if do_recover_output and token_map:
                for p in [report_path, risk_path]:
                    recovered = recover_output_text(p, token_map)
                    if recovered and str(recovered) not in result["outputs"]:
                        result["outputs"].append(str(recovered))
        return result

    raise HTTPException(status_code=400, detail=f"Unsupported upload action: {action}")


@app.post("/api/pain/build-allocation")
async def pain_build_allocation(
    file: UploadFile = File(...),
    period: str = Form(...),
    country: str = Form(...),
    entity: str = Form(...),
    vendor: str = Form(...),
    fee_type: str = Form(...),
    invoice_total: float = Form(...),
    currency: str = Form(...),
    region: str = Form(default="US"),
    root: str = Form(default=str(WORKSPACE_ROOT)),
) -> dict[str, Any]:
    target_root = to_safe_abs(root)
    input_path = await save_uploaded_file(file, "pain1")
    now = datetime.now().strftime("%Y%m%d_%H%M%S")
    region_tag = (region or "US").strip().upper()
    output_path = UPLOAD_OUTPUT_DIR / f"HC_Analysis_{region_tag}_{now}.csv"
    cmd = [
        "python3",
        str((WORKSPACE_ROOT / "痛点攻坚实施包" / "build_hc_allocation.py").resolve()),
        "--input",
        str(input_path),
        "--output",
        str(output_path),
        "--period",
        period.strip(),
        "--country",
        country.strip(),
        "--entity",
        entity.strip(),
        "--vendor",
        vendor.strip(),
        "--fee-type",
        fee_type.strip(),
        "--invoice-total",
        str(invoice_total),
        "--currency",
        currency.strip(),
    ]
    result = run_cmd(cmd, target_root, "pain1_build_allocation", meta={"region": region_tag, "step": "center"})
    if result["ok"] and str(output_path) not in result["outputs"]:
        result["outputs"].append(str(output_path))
    return result


@app.post("/api/pain/check-centers")
async def pain_check_centers(
    source_file: UploadFile = File(...),
    status_file: Optional[UploadFile] = File(default=None),
    status_path: Optional[str] = Form(default=None),
    region: str = Form(default="US"),
    root: str = Form(default=str(WORKSPACE_ROOT)),
) -> dict[str, Any]:
    target_root = to_safe_abs(root)
    source_path = await save_uploaded_file(source_file, "pain3_source")
    if status_file is not None and (status_file.filename or "").strip():
        final_status_path = await save_uploaded_file(status_file, "pain3_status")
    else:
        if status_path and status_path.strip():
            final_status_path = to_safe_abs(status_path.strip())
        else:
            final_status_path = (WORKSPACE_ROOT / "痛点攻坚实施包" / "成本中心状态表模板.csv").resolve()
        if not final_status_path.exists():
            raise HTTPException(status_code=400, detail=f"Status file not found: {final_status_path}")

    now = datetime.now().strftime("%Y%m%d_%H%M%S")
    region_tag = (region or "US").strip().upper()
    output_path = UPLOAD_OUTPUT_DIR / f"成本中心有效性检查报告_{region_tag}_{now}.md"
    cmd = [
        "python3",
        str((WORKSPACE_ROOT / "痛点攻坚实施包" / "check_cost_centers.py").resolve()),
        "--source",
        str(source_path),
        "--status",
        str(final_status_path),
        "--output",
        str(output_path),
    ]
    result = run_cmd(cmd, target_root, "pain3_check_centers", meta={"region": region_tag, "step": "center"})
    if result["ok"] and str(output_path) not in result["outputs"]:
        result["outputs"].append(str(output_path))
    return result


@app.post("/api/pain/update-ledger")
async def pain_update_ledger(
    prefill_file: UploadFile = File(...),
    ledger_file: Optional[UploadFile] = File(default=None),
    region: str = Form(default="US"),
    root: str = Form(default=str(WORKSPACE_ROOT)),
) -> dict[str, Any]:
    target_root = to_safe_abs(root)
    prefill_path = await save_uploaded_file(prefill_file, "pain4_prefill")
    now = datetime.now().strftime("%Y%m%d_%H%M%S")
    region_tag = (region or "US").strip().upper()
    output_ledger = UPLOAD_OUTPUT_DIR / f"台账_自动更新_{region_tag}_{now}.csv"

    if ledger_file is not None and (ledger_file.filename or "").strip():
        ledger_input = await save_uploaded_file(ledger_file, "pain4_ledger")
        output_ledger.write_bytes(ledger_input.read_bytes())

    cmd = [
        "python3",
        str((WORKSPACE_ROOT / "痛点攻坚实施包" / "update_ledger.py").resolve()),
        "--prefill",
        str(prefill_path),
        "--ledger",
        str(output_ledger),
    ]
    result = run_cmd(cmd, target_root, "pain4_update_ledger", meta={"region": region_tag, "step": "ledger"})
    if result["ok"] and str(output_ledger) not in result["outputs"]:
        result["outputs"].append(str(output_ledger))
    return result


@app.post("/api/webhook/knotbot")
def webhook_knotbot(
    payload: dict[str, Any],
    x_bot_token: Optional[str] = Header(default=None),
) -> WebhookResponse:
    if BOT_GATEWAY_TOKEN:
        if not x_bot_token or x_bot_token != BOT_GATEWAY_TOKEN:
            raise HTTPException(status_code=401, detail="Invalid bot token")

    text = parse_text_from_payload(payload)
    action = resolve_action_from_text(text)
    if not action:
        return WebhookResponse(
            ok=False,
            message="未识别指令。可用：帮助、US演示、痛点1-4、目录预检、HC校验、总检查、生成提单文本块",
        )

    result = run_action(RunRequest(action=action, root=str(WORKSPACE_ROOT)))
    msg = "执行成功" if result.get("ok") else "执行失败"
    return WebhookResponse(
        ok=bool(result.get("ok")),
        action=action,
        message=f"{msg}，请查看输出文件。",
        data=result,
    )


@app.get("/api/jobs/latest")
def latest() -> dict[str, Any]:
    jobs = load_jobs()
    if not jobs:
        return {"ok": True, "job": None}
    return {"ok": True, "job": jobs[-1]}


@app.get("/api/jobs")
def list_jobs(
    region: Optional[str] = Query(default=None),
    step: Optional[str] = Query(default=None),
    from_time: Optional[str] = Query(default=None),
    to_time: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
) -> dict[str, Any]:
    jobs = load_jobs()
    filtered = jobs

    if region:
        r = region.strip().upper()
        filtered = [j for j in filtered if str(j.get("region", "")).upper() == r]

    if step:
        s = step.strip().lower()
        filtered = [j for j in filtered if str(j.get("step", "")).lower() == s]

    def parse_iso(val: str) -> Optional[datetime]:
        txt = (val or "").strip()
        if not txt:
            return None
        try:
            return datetime.fromisoformat(txt)
        except ValueError:
            return None

    from_dt = parse_iso(from_time or "")
    to_dt = parse_iso(to_time or "")

    if from_time and from_dt is None:
        raise HTTPException(status_code=400, detail="Invalid from_time, expected ISO format")
    if to_time and to_dt is None:
        raise HTTPException(status_code=400, detail="Invalid to_time, expected ISO format")

    if from_dt or to_dt:
        scoped: list[dict[str, Any]] = []
        for j in filtered:
            started = parse_iso(str(j.get("started_at", "")))
            if started is None:
                continue
            if from_dt and started < from_dt:
                continue
            if to_dt and started > to_dt:
                continue
            scoped.append(j)
        filtered = scoped

    return {"ok": True, "total": len(filtered), "jobs": filtered[-limit:][::-1]}


def parse_job_time(value: str) -> Optional[datetime]:
    txt = (value or "").strip()
    if not txt:
        return None
    try:
        return datetime.fromisoformat(txt)
    except ValueError:
        return None


def classify_failure_bucket(job: dict[str, Any]) -> str:
    text = " ".join([*(job.get("stderr_tail") or []), *(job.get("stdout_tail") or [])]).lower()
    if any(k in text for k in ["missing", "field", "缺少", "字段"]):
        return "字段问题"
    if any(k in text for k in ["not found", "file", "path", "路径", "目录"]):
        return "文件问题"
    return "服务问题"


def median(values: list[float]) -> float:
    if not values:
        return 0.0
    vals = sorted(values)
    n = len(vals)
    mid = n // 2
    if n % 2 == 1:
        return float(vals[mid])
    return float((vals[mid - 1] + vals[mid]) / 2)


def latest_risk_ratio(region: str) -> float:
    pattern = f"统计提效_看板摘要_{region}_*.json"
    files = sorted(UPLOAD_OUTPUT_DIR.glob(pattern), key=lambda p: p.stat().st_mtime, reverse=True)
    for p in files:
        try:
            obj = json.loads(p.read_text(encoding="utf-8"))
            rows = float(obj.get("rows") or 0)
            high = float(obj.get("risk_high") or 0)
            if rows <= 0:
                return 0.0
            return high / rows
        except Exception:
            continue
    return 0.0


def build_region_dashboard(jobs: list[dict[str, Any]], region: str) -> dict[str, Any]:
    now = datetime.now()
    day_start = datetime(now.year, now.month, now.day)
    week_start = day_start - timedelta(days=day_start.weekday())

    region_jobs = [j for j in jobs if str(j.get("region", "")).upper() == region]
    with_time: list[tuple[dict[str, Any], datetime]] = []
    for j in region_jobs:
        dt = parse_job_time(str(j.get("started_at", "")))
        if dt is not None:
            with_time.append((j, dt))

    day_jobs = [j for j, dt in with_time if dt >= day_start]
    week_jobs = [j for j, dt in with_time if dt >= week_start]
    week_total = len(week_jobs)
    week_ok = sum(1 for j in week_jobs if bool(j.get("ok")))
    week_fail = week_total - week_ok
    success_rate = (week_ok / week_total) if week_total else 0.0
    failure_rate = (week_fail / week_total) if week_total else 0.0

    avg_by_step: dict[str, int] = {}
    for step in ["output", "center", "ledger"]:
        vals = [int(j.get("elapsed_ms")) for j in week_jobs if str(j.get("step", "")).lower() == step and isinstance(j.get("elapsed_ms"), int)]
        avg_by_step[step] = int(sum(vals) / len(vals)) if vals else 0

    fail_counter = Counter(classify_failure_bucket(j) for j in week_jobs if not bool(j.get("ok")))
    fail_top3 = [{"type": k, "count": v} for k, v in fail_counter.most_common(3)]

    # Management metrics from existing logs (no extra manual input required)
    output_ok = sum(1 for j in week_jobs if bool(j.get("ok")) and str(j.get("step", "")).lower() == "output")
    ledger_ok = sum(1 for j in week_jobs if bool(j.get("ok")) and str(j.get("step", "")).lower() == "ledger")
    ledger_miss_rate = 0.0 if output_ok == 0 else max(0.0, 1.0 - (ledger_ok / output_ok))

    center_events = sorted(
        [(j, dt) for (j, dt) in with_time if str(j.get("step", "")).lower() == "center"],
        key=lambda x: x[1],
    )
    pending_fail: list[datetime] = []
    resolution_mins: list[float] = []
    for j, dt in center_events:
        if bool(j.get("ok")):
            if pending_fail:
                first = pending_fail.pop(0)
                resolution_mins.append((dt - first).total_seconds() / 60.0)
        else:
            pending_fail.append(dt)
    block_resolution_minutes = round(median(resolution_mins), 1) if resolution_mins else 0.0

    return {
        "today_volume": len(day_jobs),
        "week_volume": week_total,
        "success_rate": round(success_rate, 4),
        "failure_rate": round(failure_rate, 4),
        "avg_elapsed_ms": avg_by_step,
        "failure_top3": fail_top3,
        "high_risk_ratio": round(latest_risk_ratio(region), 4),
        "ledger_miss_rate": round(ledger_miss_rate, 4),
        "block_resolution_minutes": block_resolution_minutes,
    }


@app.get("/api/dashboard/ops")
def ops_dashboard() -> dict[str, Any]:
    jobs = load_jobs()
    us = build_region_dashboard(jobs, "US")
    can = build_region_dashboard(jobs, "CAN")
    return {
        "ok": True,
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "definitions": {
            "today_volume": "今日处理单量（按started_at自然日）",
            "week_volume": "本周处理单量（周一至今）",
            "success_rate": "本周成功率=成功任务/总任务",
            "failure_rate": "本周失败率=失败任务/总任务",
            "avg_elapsed_ms": "各步骤平均耗时（output/center/ledger）",
            "failure_top3": "失败原因Top3（字段/文件/服务）",
        },
        "l1": {"US": us, "CAN": can},
        "l2": {
            "us_vs_can_week_volume": {"US": us["week_volume"], "CAN": can["week_volume"]},
            "us_vs_can_success_rate": {"US": us["success_rate"], "CAN": can["success_rate"]},
            "high_risk_ratio": {"US": us["high_risk_ratio"], "CAN": can["high_risk_ratio"]},
            "ledger_miss_rate": {"US": us["ledger_miss_rate"], "CAN": can["ledger_miss_rate"]},
            "block_resolution_minutes": {"US": us["block_resolution_minutes"], "CAN": can["block_resolution_minutes"]},
        },
    }


@app.get("/api/files")
def files(path: str = Query(..., description="Absolute path under workspace")) -> FileResponse:
    p = to_safe_abs(unquote(path))
    if not p.exists() or not p.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path=str(p), filename=p.name)
