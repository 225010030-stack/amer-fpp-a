#!/usr/bin/env bash
# 痛点1：自动分摊生成 HC Analysis
# 用法：
#   bash run_pain1_allocation.sh <YYYYMM> <US|CAN> <账单额> [Vendor] [FeeType]
#   bash run_pain1_allocation.sh <人数.csv> <YYYYMM> <US|CAN> <账单额> [Vendor] [FeeType]
# Vendor/FeeType 见：python3 knot-chat/lookup_vendor.py --country US --list
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"
cd "$ROOT"

DEFAULT_INPUT="$(demo_or "$DEMO_ROOT/公共/20260608_171956_pain1_成本中心人数输入模板.csv" "$ROOT/痛点攻坚实施包/成本中心人数输入模板.csv")"

VENDOR_ARG=""
FEE_TYPE_ARG=""

if is_yyyymm "${1:-}"; then
  PERIOD="$1"
  COUNTRY="${2:-}"
  INVOICE_TOTAL="${3:-}"
  VENDOR_ARG="${4:-}"
  FEE_TYPE_ARG="${5:-}"
  INPUT="$DEFAULT_INPUT"
elif [[ -n "${1:-}" ]]; then
  INPUT="$1"
  PERIOD="${2:-}"
  COUNTRY="${3:-}"
  INVOICE_TOTAL="${4:-}"
  VENDOR_ARG="${5:-}"
  FEE_TYPE_ARG="${6:-}"
else
  PERIOD=""
  COUNTRY=""
  INVOICE_TOTAL=""
  INPUT="$DEFAULT_INPUT"
fi

require_yyyymm "$PERIOD"
if [[ -z "$COUNTRY" ]]; then
  echo "ERROR: 必须指定国家 US 或 CAN"
  exit 1
fi

REGION="$(echo "$COUNTRY" | tr '[:lower:]' '[:upper:]')"
if [[ "$REGION" == "CA" ]]; then
  REGION="CAN"
fi

load_vendor_profile "$REGION" "$VENDOR_ARG" "$FEE_TYPE_ARG"

OUT="$UPLOAD_OUT/HC_Analysis_${REGION}_$(timestamp).csv"

echo "PROFILE: ${VENDOR} / ${FEE_TYPE} / ${CURRENCY} / ${ENTITY}"

python3 "$ROOT/痛点攻坚实施包/build_hc_allocation.py" \
  --input "$INPUT" \
  --output "$OUT" \
  --period "$PERIOD" \
  --country "$REGION" \
  --entity "$ENTITY" \
  --vendor "$VENDOR" \
  --fee-type "$FEE_TYPE" \
  --invoice-total "$INVOICE_TOTAL" \
  --currency "$CURRENCY"

python3 "$ROOT/check_hc_analysis.py" --file "$OUT"
echo "DONE: $OUT"
