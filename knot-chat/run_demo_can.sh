#!/usr/bin/env bash
# CAN 四痛点闭环演示（样例数据 + CAN region 参数）
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"
cd "$ROOT"

DEMO_PERIOD="202605"
DEMO_INVOICE="50000"

echo "STEP 1/4 痛点2 生成提单文本"
bash "$ROOT/knot-chat/generate_submission_blocks.sh" "$DEMO_ROOT/CAN/CAN_prefill_202605.csv"

echo "STEP 2/4 痛点1 自动分摊 (CAN)"
bash "$ROOT/knot-chat/run_pain1_allocation.sh" "$DEMO_PERIOD" CAN "$DEMO_INVOICE"

echo "STEP 3/4 痛点3 检查成本中心 (CAN)"
bash "$ROOT/knot-chat/run_pain3_check_centers.sh" \
  "$DEMO_ROOT/公共/20260608_171946_pain3_source_HC_Analysis_统一模板.csv" \
  "$DEMO_ROOT/公共/20260608_162731_pain3_status_成本中心状态表模板.csv" \
  CAN

echo "STEP 4/4 痛点4 台账更新 (CAN)"
bash "$ROOT/knot-chat/run_pain4_update_ledger.sh" \
  "$DEMO_ROOT/US/US_prefill_202605.csv" \
  "$DEMO_ROOT/公共/20260608_162731_pain4_ledger_台账模板.csv" \
  CAN

echo "DONE: CAN demo loop completed. See $UPLOAD_OUT/ (files tagged _CAN_)"
