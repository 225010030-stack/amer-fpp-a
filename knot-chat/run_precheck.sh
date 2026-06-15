#!/usr/bin/env bash
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"
cd "$ROOT"
OUT="$PRECHECK_OUT/预检报告_$(timestamp).md"
# 工作区通常没有 USA/202605 等月份目录，默认用当前月；也可传参：bash run_precheck.sh 202605,202606
MONTHS="${1:-$(date +%Y%m)}"
python3 "$ROOT/check_fpp_files.py" --root "$ROOT" --months "$MONTHS" --fix-report "$OUT"
echo "DONE: $OUT"
