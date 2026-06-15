#!/usr/bin/env bash
# 痛点3：检查成本中心有效性
# 用法：bash run_pain3_check_centers.sh [source_csv] [status_csv] [region]
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"
cd "$ROOT"

SOURCE="$(demo_or "$DEMO_ROOT/公共/20260608_171946_pain3_source_HC_Analysis_统一模板.csv" "$ROOT/HC_Analysis_统一模板.csv")"
STATUS="$(demo_or "$DEMO_ROOT/公共/20260608_162731_pain3_status_成本中心状态表模板.csv" "$ROOT/痛点攻坚实施包/成本中心状态表模板.csv")"
SOURCE="${1:-$SOURCE}"
STATUS="${2:-$STATUS}"
REGION="${3:-US}"
OUT="$UPLOAD_OUT/成本中心有效性检查报告_${REGION}_$(timestamp).md"

python3 "$ROOT/痛点攻坚实施包/check_cost_centers.py" \
  --source "$SOURCE" \
  --status "$STATUS" \
  --output "$OUT"

echo "DONE: $OUT"
