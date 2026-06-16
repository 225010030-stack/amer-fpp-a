#!/usr/bin/env bash
# 痛点3：检查成本中心有效性
# 用法：bash run_pain3_check_centers.sh [source_csv] [status_csv] [region]
# 演示：DEMO_{US|CAN}_P3_HC源文件_202605.csv + DEMO_*_P3_成本中心状态表_202605.csv
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"
cd "$ROOT"

REGION="${3:-US}"
REGION="$(echo "$REGION" | tr '[:lower:]' '[:upper:]')"
[[ "$REGION" == "CA" ]] && REGION="CAN"

SOURCE="${1:-$(demo_path "$REGION" P3_HC)}"
STATUS="${2:-$(demo_path "$REGION" P3_STATUS)}"
OUT="$UPLOAD_OUT/成本中心有效性检查报告_${REGION}_$(timestamp).md"

python3 "$ROOT/痛点攻坚实施包/check_cost_centers.py" \
  --source "$SOURCE" \
  --status "$STATUS" \
  --output "$OUT"

echo "DONE: $OUT"
