#!/usr/bin/env python3
"""Skill runner: 痛点1 自动分摊 → 调用 knot-chat 确定性脚本。"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path


def workspace_root() -> Path:
    return Path(os.getenv("WORKSPACE_ROOT", "/data/workspace/amer-fpp-a")).resolve()


def main() -> int:
    parser = argparse.ArgumentParser(description="Run skill-pain1-allocation")
    parser.add_argument("--root", default="", help="Workspace root (default: WORKSPACE_ROOT)")
    parser.add_argument("--input", default="", help="Optional input CSV path")
    parser.add_argument("--period", default="", help="Optional period YYYYMM")
    parser.add_argument("--country", default="", help="Optional country US/CA")
    parser.add_argument("--invoice-total", default="", help="Optional invoice total")
    args = parser.parse_args()

    root = Path(args.root).resolve() if args.root.strip() else workspace_root()
    runner = root / "knot-chat" / "run_pain1_allocation.sh"
    if not runner.exists():
        print(f"Missing runner: {runner}")
        return 2

    cmd = ["bash", str(runner)]
    if args.input.strip():
        cmd.append(args.input.strip())
    if args.period.strip():
        cmd.append(args.period.strip())
    if args.country.strip():
        cmd.append(args.country.strip())
    if args.invoice_total.strip():
        cmd.append(args.invoice_total.strip())

    result = subprocess.run(cmd, cwd=str(root), text=True, check=False)
    if result.stdout:
        print(result.stdout.rstrip())
    if result.stderr:
        print(result.stderr.rstrip(), file=sys.stderr)
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
