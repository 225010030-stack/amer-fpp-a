from __future__ import annotations

import json
import re
import shlex
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from wecom.client import WeComClient
from wecom.config import WeComConfig
from wecom.parser import WeComMessage

USER_STATE_FILE = "wecom_user_state.json"


def _state_path(workspace_root: Path) -> Path:
    return workspace_root / "bot-gateway" / USER_STATE_FILE


def load_user_state(workspace_root: Path) -> dict[str, Any]:
    path = _state_path(workspace_root)
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def save_user_state(workspace_root: Path, state: dict[str, Any]) -> None:
    path = _state_path(workspace_root)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def extract_output_paths(stdout: str, root: Path) -> list[str]:
    outputs: list[str] = []
    for line in stdout.splitlines():
        txt = line.strip()
        if txt.startswith("DONE: "):
            candidate = txt.replace("DONE: ", "", 1).strip()
            p = Path(candidate).expanduser().resolve()
            if p.exists() and (root in p.parents or p == root):
                outputs.append(str(p))
    uniq: list[str] = []
    seen: set[str] = set()
    for p in outputs:
        if p not in seen:
            seen.add(p)
            uniq.append(p)
    return uniq


def execute_agent_text(workspace_root: Path, text: str) -> dict[str, Any]:
    text = (text or "").strip()
    if not text:
        return {"ok": False, "message": "空指令", "outputs": []}

    run_agent = workspace_root / "knot-chat" / "run_agent.sh"
    if not run_agent.exists():
        return {"ok": False, "message": f"未找到 {run_agent}", "outputs": []}

    parts = shlex.split(text)
    cmd = ["bash", str(run_agent), *parts]
    result = subprocess.run(cmd, cwd=str(workspace_root), capture_output=True, text=True, check=False)
    outputs = extract_output_paths(result.stdout or "", workspace_root)
    ok = result.returncode == 0
    msg_lines = (result.stdout or "").splitlines()[-8:]
    message = "\n".join(msg_lines).strip() or ("执行成功" if ok else "执行失败")
    if result.stderr.strip():
        message += "\n" + result.stderr.strip()[-500:]
    return {
        "ok": ok,
        "message": message[:1800],
        "outputs": outputs,
        "exit_code": result.returncode,
    }


def sanitize_filename(name: str) -> str:
    cleaned = re.sub(r"[^\w.\-一-龥]", "_", name or "upload.csv")
    return cleaned[:120] or "upload.csv"


def save_incoming_file(
    client: WeComClient,
    workspace_root: Path,
    msg: WeComMessage,
) -> Path:
    upload_dir = workspace_root / "上传输入"
    upload_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    fname = sanitize_filename(msg.file_name or f"IN_WEcom_{ts}.csv")
    if not fname.lower().endswith(".csv"):
        fname = f"{fname}.csv"
    dest = upload_dir / f"IN_WEcom_{ts}_{fname}"
    client.download_media(msg.media_id, dest)
    return dest


def rel_upload_path(workspace_root: Path, abs_path: Path) -> str:
    try:
        rel = abs_path.resolve().relative_to(workspace_root.resolve())
        return str(rel).replace("\\", "/")
    except ValueError:
        return str(abs_path)


def build_download_links(config: WeComConfig, abs_paths: list[str]) -> list[str]:
    if not config.public_base_url:
        return []
    links: list[str] = []
    for p in abs_paths:
        links.append(f"{config.public_base_url}/api/files?path={p}")
    return links


class WeComHandler:
    def __init__(self, config: WeComConfig, workspace_root: Path) -> None:
        self.config = config
        self.workspace_root = workspace_root
        self.client = WeComClient(config)

    def handle_message(self, msg: WeComMessage) -> str:
        user = msg.from_user
        if not user:
            return "success"

        if msg.msg_type == "event":
            return "success"

        if msg.msg_type == "file" and msg.media_id:
            return self._handle_file(user, msg)

        if msg.msg_type == "text":
            text = (msg.content or msg.recognition or "").strip()
            if text:
                return self._handle_text(user, text)

        self.client.send_text(
            user,
            "暂不支持该消息类型。请发文字指令（如：主菜单、US演示）或发送 CSV 文件。",
        )
        return "success"

    def _handle_file(self, user: str, msg: WeComMessage) -> str:
        try:
            saved = save_incoming_file(self.client, self.workspace_root, msg)
            rel = rel_upload_path(self.workspace_root, saved)
            state = load_user_state(self.workspace_root)
            state[user] = {"last_upload": rel, "updated_at": datetime.now().isoformat(timespec="seconds")}
            save_user_state(self.workspace_root, state)
            self.client.send_text(
                user,
                "【已收到文件】\n"
                f"路径：{rel}\n\n"
                "请继续发指令，例如：\n"
                f"• 4 {rel}\n"
                f"• 2 {rel} 202607 US 145411.03\n"
                "• 主菜单",
            )
        except Exception as exc:  # noqa: BLE001
            self.client.send_text(user, f"文件接收失败：{exc}")
        return "success"

    def _handle_text(self, user: str, text: str) -> str:
        lowered = text.lower().strip()
        if lowered in {"使用上次文件", "上次文件", "use last file"}:
            state = load_user_state(self.workspace_root)
            last = (state.get(user) or {}).get("last_upload")
            if last:
                text = f"4 {last}"

        result = execute_agent_text(self.workspace_root, text)
        lines = [
            "【AMER FPP】",
            "【状态】成功" if result.get("ok") else "【状态】失败",
            result.get("message", "")[:1200],
        ]
        outputs: list[str] = result.get("outputs") or []
        if outputs:
            lines.append("\n【输出文件】")
            for p in outputs:
                lines.append(f"• {Path(p).name}")
            links = build_download_links(self.config, outputs)
            if links:
                lines.append("\n【下载链接】")
                for link in links:
                    lines.append(link)

        self.client.send_text(user, "\n".join(lines))

        sent = 0
        for abs_path in outputs:
            if sent >= self.config.max_reply_files:
                break
            p = Path(abs_path)
            if not p.exists() or not p.is_file():
                continue
            if p.stat().st_size > self.config.max_file_bytes:
                continue
            try:
                media_id = self.client.upload_file(p)
                self.client.send_file(user, media_id)
                sent += 1
            except Exception:  # noqa: BLE001
                continue

        return "success"
