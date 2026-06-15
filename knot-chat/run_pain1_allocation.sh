#!/usr/bin/env bash
# 痛点1：自动分摊生成 HC Analysis
# 用法：
#   bash run_pain1_allocation.sh <YYYYMM> [US|CAN] [账单总额]           # 用演示/默认人数 CSV
#   bash run_pain1_allocation.sh <人数.csv> <YYYYMM> [US|CAN] [账单额]
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"
cd "$ROOT"

DEFAULT_INPUT="$(demo_or "$DEMO_ROOT/公共/20260608_171956_pain1_成本中心人数输入模板.csv" "$ROOT/痛点攻坚实施包/成本中心人数输入模板.csv")"

if is_yyyymm "${1:-}"; then
  PERIOD="$1"
  COUNTRY="${2:-US}"
  INVOICE_TOTAL="${3:-145411.03}"
  INPUT="$DEFAULT_INPUT"
elif [[ -n "${1:-}" ]]; then
  INPUT="$1"
  PERIOD="${2:-}"
  COUNTRY="${3:-US}"
  INVOICE_TOTAL="${4:-145411.03}"
else
  PERIOD=""
  INPUT="$DEFAULT_INPUT"
  COUNTRY="${2:-US}"
  INVOICE_TOTAL="${3:-145411.03}"
fi

require_yyyymm "$PERIOD"

REGION="$(echo "$COUNTRY" | tr '[:lower:]' '[:upper:]')"
OUT="$UPLOAD_OUT/HC_Analysis_${REGION}_$(timestamp).csv"

python3 "$ROOT/痛点攻坚实施包/build_hc_allocation.py" \
  --input "$INPUT" \
  --output "$OUT" \
  --period "$PERIOD" \
  --country "$COUNTRY" \
  --entity "Tencent America LLC" \
  --vendor "Anthem" \
  --fee-type "Medical Insurance" \
  --invoice-total "$INVOICE_TOTAL" \
  --currency USD

python3 "$ROOT/check_hc_analysis.py" --file "$OUT"
echo "DONE: $OUT"
