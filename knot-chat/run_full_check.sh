#!/usr/bin/env bash
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MONTHS="${1:-}"
HC_FILE="${2:-}"
require_months_csv "$MONTHS"
bash "$ROOT/knot-chat/run_precheck.sh" "$MONTHS"
if [[ -n "$HC_FILE" ]]; then
  bash "$ROOT/knot-chat/run_hc_check.sh" "$HC_FILE"
else
  bash "$ROOT/knot-chat/run_hc_check.sh"
fi
echo "DONE: full check completed for months=$MONTHS"
