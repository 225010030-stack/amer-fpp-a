#!/usr/bin/env bash
# 痛点1：自动分摊生成 HC Analysis
# 用法：
#   bash run_pain1_allocation.sh <YYYYMM> <US|CAN> <账单额> [Vendor] [FeeType]
#   bash run_pain1_allocation.sh <人数.csv> <YYYYMM> <US|CAN> <账单额> [Vendor] [FeeType]
# 演示人数样例：DEMO_US_P1_人数输入_202605.csv / DEMO_CAN_P1_人数输入_202605.csv
# 上传命名：IN_US_P1_人数_202607.csv（见 测试文档/上传命名示例/）
# Vendor/FeeType 见：python3 knot-chat/lookup_vendor.py --country US --list
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"
cd "$ROOT"

VENDOR_ARG=""
FEE_TYPE_ARG=""
USE_DEMO_INPUT=0

if is_yyyymm "${1:-}"; then
  PERIOD="$1"
  COUNTRY="${2:-}"
  INVOICE_TOTAL="${3:-}"
  VENDOR_ARG="${4:-}"
  FEE_TYPE_ARG="${5:-}"
  USE_DEMO_INPUT=1
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
  USE_DEMO_INPUT=1
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

if [[ "$USE_DEMO_INPUT" -eq 1 ]]; then
  INPUT="$(demo_path "$REGION" P1)"
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
