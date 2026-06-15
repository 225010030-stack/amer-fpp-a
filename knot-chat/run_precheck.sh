#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p "$ROOT/目录预检输出"
OUT="$ROOT/目录预检输出/预检报告_$(date +%Y%m%d_%H%M%S).md"
python3 "$ROOT/check_fpp_files.py" --root "$ROOT" --fix-report "$OUT"
echo "DONE: $OUT"
