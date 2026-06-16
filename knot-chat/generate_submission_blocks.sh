#!/usr/bin/env bash
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"
cd "$ROOT"
INPUT="${1:-$(demo_path US P2)}"
OUT="$UPLOAD_OUT/FPP提单文本块_$(timestamp).md"
python3 "$ROOT/generate_fpp_submission_blocks.py" --input "$INPUT" --output "$OUT"
echo "DONE: $OUT"
