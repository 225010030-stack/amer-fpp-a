#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p "$ROOT/HC校验输出"
OUT="$ROOT/HC校验输出/HC校验报告_$(date +%Y%m%d_%H%M%S).md"
HC_FILE="${1:-$ROOT/HC_Analysis_统一模板.csv}"
python3 "$ROOT/check_hc_analysis.py" --file "$HC_FILE" | tee "$OUT"
echo "DONE: $OUT"
