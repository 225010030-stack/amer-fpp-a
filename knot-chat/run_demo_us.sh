#!/usr/bin/env bash
# US 四痛点闭环演示
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"
cd "$ROOT"

DEMO_PERIOD="202605"
DEMO_INVOICE="145411.03"

echo "STEP 1/4 痛点2 生成提单文本"
bash "$ROOT/knot-chat/generate_submission_blocks.sh" "$(demo_path US P2)"

echo "STEP 2/4 痛点1 自动分摊 (US)"
bash "$ROOT/knot-chat/run_pain1_allocation.sh" "$DEMO_PERIOD" US "$DEMO_INVOICE"

echo "STEP 3/4 痛点3 检查成本中心 (US)"
bash "$ROOT/knot-chat/run_pain3_check_centers.sh" \
  "$(demo_path US P3_HC)" \
  "$(demo_path US P3_STATUS)" \
  US

echo "STEP 4/4 痛点4 台账更新 (US)"
bash "$ROOT/knot-chat/run_pain4_update_ledger.sh" \
  "$(demo_path US P2)" \
  "$(demo_path US P4)" \
  US

echo "DONE: US demo loop completed. See $UPLOAD_OUT/ (files tagged _US_)"
