#!/usr/bin/env bash
# 痛点4：台账自动更新
# 用法：bash run_pain4_update_ledger.sh [prefill_csv] [ledger_csv] [region]
# 演示：DEMO_{US|CAN}_P2_提单预填表_202605.csv + DEMO_*_P4_台账_202605.csv
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"
cd "$ROOT"

REGION="${3:-US}"
REGION="$(echo "$REGION" | tr '[:lower:]' '[:upper:]')"
[[ "$REGION" == "CA" ]] && REGION="CAN"

PREFILL="${1:-$(demo_path "$REGION" P2)}"
LEDGER="${2:-$(demo_path "$REGION" P4)}"
WORK_LEDGER="$UPLOAD_OUT/台账_工作副本_${REGION}_$(timestamp).csv"
OUT="$UPLOAD_OUT/台账_自动更新_${REGION}_$(timestamp).csv"

cp "$LEDGER" "$WORK_LEDGER"
python3 "$ROOT/痛点攻坚实施包/update_ledger.py" \
  --prefill "$PREFILL" \
  --ledger "$WORK_LEDGER"

mv "$WORK_LEDGER" "$OUT"
echo "DONE: $OUT"
