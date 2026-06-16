"""Git sync helpers for bot-gateway (auto pull before task runs)."""

from __future__ import annotations

import os
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

_LAST_SYNC: dict[str, Any] = {"ok": None, "time": None, "message": ""}


def auto_sync_enabled() -> bool:
    return os.getenv("AUTO_SYNC_ON_RUN", "true").strip().lower() in {"1", "true", "yes", "y", "on"}


def git_head(root: Path) -> str:
    try:
        out = subprocess.run(
            ["git", "-C", str(root), "rev-parse", "--short", "HEAD"],
            capture_output=True,
            text=True,
            check=False,
        )
        return (out.stdout or "").strip() or "unknown"
    except Exception:
        return "unknown"


def sync_workspace(root: Path, force: bool = False) -> dict[str, Any]:
    global _LAST_SYNC
    if not force and not auto_sync_enabled():
        return {"ok": True, "skipped": True, "reason": "AUTO_SYNC_ON_RUN=false"}

    if not (root / ".git").is_dir():
        result = {"ok": False, "skipped": True, "reason": "not a git repo", "root": str(root)}
        _LAST_SYNC = {**result, "time": datetime.now().isoformat(timespec="seconds")}
        return result

    sync_sh = root / "knot-chat" / "sync_workspace.sh"
    if sync_sh.is_file():
        cmd = ["bash", str(sync_sh)]
    else:
        cmd = ["git", "-C", str(root), "pull", "origin", "main"]

    proc = subprocess.run(cmd, capture_output=True, text=True, check=False)
    ok = proc.returncode == 0
    result = {
        "ok": ok,
        "skipped": False,
        "root": str(root),
        "commit": git_head(root),
        "stdout": (proc.stdout or "").strip()[-500:],
        "stderr": (proc.stderr or "").strip()[-500:],
        "time": datetime.now().isoformat(timespec="seconds"),
    }
    _LAST_SYNC = result
    return result


def last_sync_status() -> dict[str, Any]:
    return dict(_LAST_SYNC)
