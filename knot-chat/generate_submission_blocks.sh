#!/usr/bin/env bash
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"
cd "$ROOT"
INPUT="$(demo_or "$DEMO_ROOT/US/US_prefill_202605.csv" "$ROOT/提单预填表模板.csv")"
INPUT="${1:-$INPUT}"
OUT="$UPLOAD_OUT/FPP提单文本块_$(timestamp).md"
python3 "$ROOT/generate_fpp_submission_blocks.py" --input "$INPUT" --output "$OUT"
echo "DONE: $OUT"
