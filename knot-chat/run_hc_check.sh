#!/usr/bin/env bash
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"
cd "$ROOT"
OUT="$HC_OUT/HC校验报告_$(timestamp).md"
HC_FILE="${1:-$(demo_path US P3_HC)}"
python3 "$ROOT/check_hc_analysis.py" --file "$HC_FILE" | tee "$OUT"
echo "DONE: $OUT"
