#!/usr/bin/env bash
# CAN 四痛点闭环演示（样例数据 + CAN region 参数）
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"
cd "$ROOT"

DEMO_PERIOD="202605"
DEMO_INVOICE="50000"

echo "STEP 1/4 痛点2 生成提单文本"
bash "$ROOT/knot-chat/generate_submission_blocks.sh" "$(demo_path CAN P2)"

echo "STEP 2/4 痛点1 自动分摊 (CAN)"
bash "$ROOT/knot-chat/run_pain1_allocation.sh" "$DEMO_PERIOD" CAN "$DEMO_INVOICE"

echo "STEP 3/4 痛点3 检查成本中心 (CAN)"
bash "$ROOT/knot-chat/run_pain3_check_centers.sh" \
  "$(demo_path CAN P3_HC)" \
  "$(demo_path CAN P3_STATUS)" \
  CAN

echo "STEP 4/4 痛点4 台账更新 (CAN)"
bash "$ROOT/knot-chat/run_pain4_update_ledger.sh" \
  "$(demo_path CAN P2)" \
  "$(demo_path CAN P4)" \
  CAN

echo "DONE: CAN demo loop completed. See $UPLOAD_OUT/ (files tagged _CAN_)"
