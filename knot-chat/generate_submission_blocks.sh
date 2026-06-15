#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p "$ROOT/上传输出"
INPUT="${1:-$ROOT/提单预填表模板.csv}"
OUT="$ROOT/上传输出/FPP提单文本块_$(date +%Y%m%d_%H%M%S).md"
python3 "$ROOT/generate_fpp_submission_blocks.py" --input "$INPUT" --output "$OUT"
echo "DONE: $OUT"
