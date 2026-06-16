#!/usr/bin/env bash
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"
cd "$ROOT"
OUT="$PRECHECK_OUT/预检报告_$(timestamp).md"

# 用法：
#   bash run_precheck.sh 202607           # US+CAN 都查
#   bash run_precheck.sh 202607 US        # 只查 USA 目录
#   bash run_precheck.sh CAN 202607       # 只查 CAN 目录
MONTHS=""
COUNTRY="ALL"

for arg in "$@"; do
  u="$(echo "$arg" | tr '[:lower:]' '[:upper:]')"
  if [[ "$u" == "US" || "$u" == "USA" ]]; then
    COUNTRY="US"
  elif [[ "$u" == "CAN" || "$u" == "CA" ]]; then
    COUNTRY="CAN"
  elif [[ -n "$arg" ]]; then
    MONTHS="$arg"
  fi
done

require_months_csv "$MONTHS"

python3 "$ROOT/check_fpp_files.py" \
  --root "$ROOT" \
  --months "$MONTHS" \
  --country "$COUNTRY" \
  --fix-report "$OUT"

echo "DONE: $OUT (country_filter=$COUNTRY)"
