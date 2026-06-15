#!/usr/bin/env python3
"""Skill runner: 痛点4 台账自动更新。"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path


def workspace_root() -> Path:
    return Path(os.getenv("WORKSPACE_ROOT", "/data/workspace/amer-fpp-a")).resolve()


def main() -> int:
    parser = argparse.ArgumentParser(description="Run skill-pain4-update-ledger")
    parser.add_argument("--root", default="")
    parser.add_argument("--prefill", default="")
    parser.add_argument("--ledger", default="")
    parser.add_argument("--region", default="")
    args = parser.parse_args()

    root = Path(args.root).resolve() if args.root.strip() else workspace_root()
    agent = root / "knot-chat" / "run_agent.sh"
    if not agent.exists():
        print(f"Missing runner: {agent}")
        return 2

    cmd = ["bash", str(agent), "痛点4"]
    for val in (args.prefill, args.ledger, args.region):
        if val.strip():
            cmd.append(val.strip())

    result = subprocess.run(cmd, cwd=str(root), text=True, check=False)
    if result.stdout:
        print(result.stdout.rstrip())
    if result.stderr:
        print(result.stderr.rstrip(), file=sys.stderr)
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
