#!/usr/bin/env bash
# 痛点4：台账自动更新
# 用法：bash run_pain4_update_ledger.sh [prefill_csv] [ledger_csv] [region]
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"
cd "$ROOT"

PREFILL="$(demo_or "$DEMO_ROOT/US/US_prefill_202605.csv" "$ROOT/提单预填表模板.csv")"
LEDGER="$(demo_or "$DEMO_ROOT/公共/20260608_162731_pain4_ledger_台账模板.csv" "$ROOT/痛点攻坚实施包/台账模板.csv")"
PREFILL="${1:-$PREFILL}"
LEDGER="${2:-$LEDGER}"
REGION="${3:-US}"
WORK_LEDGER="$UPLOAD_OUT/台账_工作副本_${REGION}_$(timestamp).csv"
OUT="$UPLOAD_OUT/台账_自动更新_${REGION}_$(timestamp).csv"

cp "$LEDGER" "$WORK_LEDGER"
python3 "$ROOT/痛点攻坚实施包/update_ledger.py" \
  --prefill "$PREFILL" \
  --ledger "$WORK_LEDGER"

mv "$WORK_LEDGER" "$OUT"
echo "DONE: $OUT"
