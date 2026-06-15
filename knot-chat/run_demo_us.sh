#!/usr/bin/env bash
# US 四痛点闭环演示（使用 测试文档/闭环CSV 样例，规则脚本无 LLM 编造）
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"
cd "$ROOT"

echo "STEP 1/4 痛点2 生成提单文本"
bash "$ROOT/knot-chat/generate_submission_blocks.sh" "$DEMO_ROOT/US/US_prefill_202605.csv"

echo "STEP 2/4 痛点1 自动分摊"
bash "$ROOT/knot-chat/run_pain1_allocation.sh"

echo "STEP 3/4 痛点3 检查成本中心"
bash "$ROOT/knot-chat/run_pain3_check_centers.sh"

echo "STEP 4/4 痛点4 台账更新"
bash "$ROOT/knot-chat/run_pain4_update_ledger.sh"

echo "DONE: US demo loop completed. See $UPLOAD_OUT/"
