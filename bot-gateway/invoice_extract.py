#!/usr/bin/env python3
"""2.1 Invoice / image extract with local text + optional Knot vision agent."""

from __future__ import annotations

import base64
import json
import mimetypes
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import requests

SETTINGS_FILE = Path(__file__).resolve().parent / "config" / "invoice_extract_settings.json"
PROFILES_FILE = Path(__file__).resolve().parent / "config" / "invoice_extract_profiles.json"
FEEDBACK_FILE_NAME = "invoice_extract_feedback.jsonl"

FIELD_KEYS = ("vendor", "amount", "currency", "period", "invoice_no")


def load_json(path: Path, default: dict[str, Any]) -> dict[str, Any]:
    if not path.is_file():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def save_settings(data: dict[str, Any]) -> None:
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    SETTINGS_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def get_settings() -> dict[str, Any]:
    return load_json(SETTINGS_FILE, {"default_mode": "local", "knot_vision": {"enabled": False}})


def get_profiles() -> dict[str, Any]:
    return load_json(PROFILES_FILE, {"profiles": {}})


def save_profiles(data: dict[str, Any]) -> None:
    PROFILES_FILE.parent.mkdir(parents=True, exist_ok=True)
    PROFILES_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def extract_pdf_text(path: Path) -> str:
    try:
        from pypdf import PdfReader  # type: ignore
    except ImportError:
        return ""
    try:
        reader = PdfReader(str(path))
        parts = []
        for page in reader.pages[:20]:
            parts.append(page.extract_text() or "")
        return "\n".join(parts)
    except Exception:
        return ""


def read_file_bytes(path: Path) -> tuple[bytes, str]:
    data = path.read_bytes()
    mime, _ = mimetypes.guess_type(str(path))
    return data, mime or "application/octet-stream"


def pdf_first_page_to_png(path: Path, zoom: float = 2.0) -> tuple[bytes, str]:
    """Render PDF page 1 to PNG for vision models that only accept images."""
    try:
        import fitz  # type: ignore  # pymupdf
    except ImportError as exc:
        raise RuntimeError("knot_agent 识图需要 pymupdf：pip install pymupdf") from exc
    doc = fitz.open(str(path))
    try:
        if doc.page_count == 0:
            raise ValueError("PDF 无页面")
        page_idx = 0
        for i in range(min(doc.page_count, 5)):
            txt = (doc[i].get_text() or "").lower()
            if "amount due" in txt or "total" in txt or "payment" in txt:
                page_idx = i
                break
        pix = doc[page_idx].get_pixmap(matrix=fitz.Matrix(zoom, zoom))
        return pix.tobytes("png"), "image/png"
    finally:
        doc.close()


def vision_payload_bytes(path: Path) -> tuple[bytes, str, str]:
    """Bytes + mime for Knot vision; PDF is auto-converted to PNG."""
    data, mime = read_file_bytes(path)
    if path.suffix.lower() == ".pdf" or mime == "application/pdf":
        png, png_mime = pdf_first_page_to_png(path)
        return png, png_mime, f"{path.stem}_page1.png"
    return data, mime, path.name


def _field(value: str, confidence: float, source: str, note: str = "") -> dict[str, Any]:
    return {"value": value, "confidence": round(confidence, 3), "source": source, "note": note}


def _best_amount(text: str, patterns: list[str]) -> tuple[str, float]:
    best_val = ""
    best_conf = 0.0
    for pat in patterns:
        for m in re.finditer(pat, text, re.I):
            raw = m.group(1).replace(",", "")
            try:
                val = float(raw)
                if val > 0 and val >= (float(best_val.replace(",", "")) if best_val else 0):
                    best_val = f"{val:.2f}"
                    best_conf = 0.72 if "Total" in pat or "Due" in pat else 0.55
            except ValueError:
                continue
    if not best_val:
        for m in re.finditer(r"\$?\s*([0-9]{1,3}(?:,[0-9]{3})+\.\d{2})", text):
            raw = m.group(1).replace(",", "")
            try:
                val = float(raw)
                if val > 100 and val >= (float(best_val.replace(",", "")) if best_val else 0):
                    best_val = f"{val:.2f}"
                    best_conf = 0.45
            except ValueError:
                continue
    return best_val, best_conf


def _best_period(text: str, patterns: list[str], hint: str = "") -> tuple[str, float]:
    if hint and re.fullmatch(r"20\d{4}", hint):
        return hint, 0.95
    for pat in patterns:
        m = re.search(pat, text, re.I)
        if m:
            g = m.group(1)
            if re.fullmatch(r"20\d{4}", g):
                return g, 0.7
    m = re.search(r"(20\d{4})", text)
    if m:
        return m.group(1), 0.5
    return hint or "", 0.2 if hint else 0.0


def local_extract(text: str, profile: dict[str, Any], period_hint: str = "") -> dict[str, Any]:
    vendor = profile.get("vendor", "")
    currency = profile.get("currency", "")
    amount, amt_conf = _best_amount(text, profile.get("amount_patterns") or [])
    period, per_conf = _best_period(text, profile.get("period_patterns") or [], period_hint)
    ven_conf = 0.85 if vendor and vendor.lower() in text.lower() else 0.4
    for kw in profile.get("vendor_keywords") or []:
        if kw.lower() in text.lower():
            ven_conf = 0.88
            vendor = profile.get("vendor") or kw
            break
    cur_conf = 0.9 if currency else 0.3
    inv_no = ""
    inv_conf = 0.0
    m = re.search(r"(?:Invoice|Inv)[#:\s]*([A-Z0-9-]{5,})", text, re.I)
    if m:
        inv_no = m.group(1)
        inv_conf = 0.65
    fields = {
        "vendor": _field(vendor, ven_conf, "local_regex"),
        "amount": _field(amount, amt_conf, "local_regex", "建议与台账含税总额交叉核对"),
        "currency": _field(currency, cur_conf, "profile_default"),
        "period": _field(period, per_conf, "local_regex"),
        "invoice_no": _field(inv_no, inv_conf, "local_regex"),
    }
    return fields


def call_knot_vision(
    file_path: Path,
    profile: dict[str, Any],
    profile_id: str,
    settings: dict[str, Any],
) -> Optional[dict[str, Any]]:
    kv = settings.get("knot_vision") or {}
    url = (kv.get("webhook_url") or "").strip()
    if not kv.get("enabled") or not url:
        return None
    try:
        data_bytes, mime, vision_name = vision_payload_bytes(file_path)
    except Exception as exc:
        return {"_error": _field(str(exc), 0.0, "knot_vision", "PDF 转 PNG 失败")}
    b64 = base64.b64encode(data_bytes).decode("ascii")
    payload = {
        "task": "invoice_extract",
        "profile_id": profile_id,
        "mime": mime,
        "filename": vision_name,
        "source_filename": file_path.name,
        "image_base64": b64,
        "prompt": profile.get("knot_prompt") or "Extract invoice fields as JSON with confidence per field.",
        "fields_requested": list(FIELD_KEYS),
    }
    headers = {"Content-Type": "application/json"}
    token = (kv.get("token") or "").strip()
    if token:
        hdr = kv.get("token_header") or "Authorization"
        prefix = kv.get("token_prefix") or ""
        headers[hdr] = f"{prefix}{token}"
    timeout = int(kv.get("timeout_seconds") or 120)
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=timeout)
        resp.raise_for_status()
        body = resp.json()
        if isinstance(body.get("fields"), dict):
            return body["fields"]
        if isinstance(body.get("data", {}).get("fields"), dict):
            return body["data"]["fields"]
        # try parse text content
        text = body.get("text") or body.get("message") or ""
        if text.strip().startswith("{"):
            parsed = json.loads(text)
            if isinstance(parsed.get("fields"), dict):
                return parsed["fields"]
    except Exception as exc:
        return {"_error": _field(str(exc), 0.0, "knot_vision", "Knot 识图 Agent 调用失败")}
    return None


def merge_fields(local: dict[str, Any], remote: Optional[dict[str, Any]], mode: str) -> dict[str, Any]:
    if not remote or mode != "knot_agent":
        return local
    out: dict[str, Any] = {}
    for key in FIELD_KEYS:
        loc = local.get(key) or _field("", 0.0, "local")
        rem = remote.get(key)
        if isinstance(rem, dict) and rem.get("value"):
            rv = str(rem.get("value", ""))
            rc = float(rem.get("confidence") or 0.8)
            lc = float(loc.get("confidence") or 0)
            if rc >= lc:
                out[key] = _field(rv, rc, "knot_vision")
            else:
                out[key] = loc
        else:
            out[key] = loc
    if "_error" in remote:
        out["_knot_error"] = remote["_error"]
    return out


def compare_ledger(fields: dict[str, Any], ledger_amount: str = "", ledger_vendor: str = "") -> list[dict[str, Any]]:
    notes: list[dict[str, Any]] = []
    if ledger_amount and fields.get("amount", {}).get("value"):
        try:
            a = float(str(fields["amount"]["value"]).replace(",", ""))
            b = float(str(ledger_amount).replace(",", ""))
            diff = abs(a - b)
            ok = diff < 0.02
            notes.append({
                "check": "amount_vs_ledger",
                "ok": ok,
                "message": "与台账金额一致" if ok else f"与台账差额 {diff:.2f}（台账为准）",
            })
        except ValueError:
            notes.append({"check": "amount_vs_ledger", "ok": False, "message": "金额格式无法比较"})
    if ledger_vendor and fields.get("vendor", {}).get("value"):
        ok = ledger_vendor.lower() in str(fields["vendor"]["value"]).lower() or str(fields["vendor"]["value"]).lower() in ledger_vendor.lower()
        notes.append({
            "check": "vendor_vs_ledger",
            "ok": ok,
            "message": "供应商与台账一致" if ok else "供应商与台账不一致（台账为准）",
        })
    return notes


def build_report_md(
    filename: str,
    profile_id: str,
    mode: str,
    fields: dict[str, Any],
    checks: list[dict[str, Any]],
    text_preview: str,
) -> str:
    lines = [
        "# Invoice 识图核对报告 · 2.1",
        "",
        f"- 文件：`{filename}`",
        f"- Profile：`{profile_id}`",
        f"- 模式：`{mode}`",
        f"- 生成时间：{datetime.now().isoformat(timespec='seconds')}",
        "",
        "## 抽取字段（含置信度）",
        "",
        "| 字段 | 值 | 置信度 | 来源 |",
        "|------|-----|--------|------|",
    ]
    for key in FIELD_KEYS:
        f = fields.get(key) or {}
        lines.append(f"| {key} | {f.get('value', '—')} | {f.get('confidence', '—')} | {f.get('source', '—')} |")
    warn = get_settings().get("confidence_warn_below") or 0.75
    low = [k for k in FIELD_KEYS if float((fields.get(k) or {}).get("confidence") or 0) < warn]
    if low:
        lines.extend(["", f"⚠ 低置信度字段：{', '.join(low)}（建议人工核对，**不锁定后续步骤**）"])
    if checks:
        lines.extend(["", "## 与台账交叉校验", ""])
        for c in checks:
            mark = "✓" if c.get("ok") else "⚠"
            lines.append(f"- {mark} {c.get('message')}")
    lines.extend(["", "## 文本预览（local 前 800 字）", "", "```", (text_preview or "")[:800], "```", ""])
    return "\n".join(lines)


def run_extract(
    file_path: Path,
    profile_id: str,
    period_hint: str = "",
    mode: str = "",
    ledger_amount: str = "",
    ledger_vendor: str = "",
    output_dir: Path | None = None,
) -> dict[str, Any]:
    settings = get_settings()
    profiles = get_profiles().get("profiles") or {}
    profile = profiles.get(profile_id)
    if not profile:
        raise ValueError(f"Unknown profile: {profile_id}")
    use_mode = (mode or settings.get("default_mode") or "local").strip()
    suffix = file_path.suffix.lower()
    text = ""
    if suffix == ".pdf":
        text = extract_pdf_text(file_path)
    elif suffix in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
        text = ""
    else:
        try:
            text = file_path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            text = ""

    local_fields = local_extract(text, profile, period_hint)
    remote_fields = None
    knot_on = (settings.get("knot_vision") or {}).get("enabled")
    if use_mode == "knot_agent" or (knot_on and suffix in {".pdf", ".png", ".jpg", ".jpeg", ".webp"}):
        remote_fields = call_knot_vision(file_path, profile, profile_id, settings)
        if remote_fields:
            use_mode = "knot_agent"
    fields = merge_fields(local_fields, remote_fields, use_mode if remote_fields else "local")
    checks = compare_ledger(fields, ledger_amount, ledger_vendor or profile.get("vendor", ""))

    out_dir = output_dir or file_path.parent
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_path = out_dir / f"Invoice识图报告_{profile_id}_{ts}.md"
    report_path.write_text(
        build_report_md(file_path.name, profile_id, use_mode, fields, checks, text),
        encoding="utf-8",
    )
    json_path = out_dir / f"Invoice识图结果_{profile_id}_{ts}.json"
    result = {
        "ok": True,
        "mode": use_mode,
        "profile_id": profile_id,
        "fields": fields,
        "checks": checks,
        "report_path": str(report_path),
        "json_path": str(json_path),
        "text_chars": len(text),
        "knot_vision_configured": bool((settings.get("knot_vision") or {}).get("webhook_url")),
    }
    json_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    result["outputs"] = [str(report_path), str(json_path)]
    return result


def append_feedback(entry: dict[str, Any], output_dir: Path) -> Path:
    path = output_dir / FEEDBACK_FILE_NAME
    path.parent.mkdir(parents=True, exist_ok=True)
    entry = {**entry, "ts": datetime.now().isoformat(timespec="seconds")}
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    return path
