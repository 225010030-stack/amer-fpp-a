#!/usr/bin/env bash
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"
cd "$ROOT"
OUT="$HC_OUT/HC校验报告_$(timestamp).md"
HC_FILE="$(demo_or "$DEMO_ROOT/公共/20260608_171946_pain3_source_HC_Analysis_统一模板.csv" "$ROOT/HC_Analysis_统一模板.csv")"
HC_FILE="${1:-$HC_FILE}"
python3 "$ROOT/check_hc_analysis.py" --file "$HC_FILE" | tee "$OUT"
echo "DONE: $OUT"
