#!/usr/bin/env bash
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"
cd "$ROOT"
OUT="$PRECHECK_OUT/预检报告_$(timestamp).md"
# 必须显式指定月份，例如：bash run_precheck.sh 202607 或 202606,202607
MONTHS="${1:-}"
require_months_csv "$MONTHS"
python3 "$ROOT/check_fpp_files.py" --root "$ROOT" --months "$MONTHS" --fix-report "$OUT"
echo "DONE: $OUT"
