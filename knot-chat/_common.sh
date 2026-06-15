#!/usr/bin/env bash
# Shared helpers for knot-chat scripts (source, do not execute directly).
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEMO_ROOT="$ROOT/测试文档/闭环CSV"
UPLOAD_OUT="$ROOT/上传输出"
PRECHECK_OUT="$ROOT/目录预检输出"
HC_OUT="$ROOT/HC校验输出"

mkdir -p "$UPLOAD_OUT" "$PRECHECK_OUT" "$HC_OUT"

demo_or() {
  local demo="$1"
  local fallback="$2"
  if [[ -f "$demo" ]]; then
    echo "$demo"
  else
    echo "$fallback"
  fi
}

timestamp() {
  date +%Y%m%d_%H%M%S
}

# 6 位账单月 YYYYMM（01–12）
is_yyyymm() {
  [[ "${1:-}" =~ ^20[0-9]{2}(0[1-9]|1[0-2])$ ]]
}

require_yyyymm() {
  local label="${2:-账单期间}"
  local val="${1:-}"
  if ! is_yyyymm "$val"; then
    cat <<EOF
ERROR: 必须指定${label}（6 位 YYYYMM，如 202607）
用法示例：
  bash knot-chat/run_precheck.sh 202607
  bash knot-chat/run_precheck.sh 202606,202607
  bash knot-chat/run_pain1_allocation.sh 上传输入/人数.csv 202607 US 145411.03
  bash knot-chat/run_pain1_allocation.sh 202607 US 145411.03
说明：系统不会默认任何账单月份，请每次明确指定。
EOF
    exit 1
  fi
}

require_months_csv() {
  local raw="${1:-}"
  if [[ -z "$raw" ]]; then
    require_yyyymm "" "账单月份"
  fi
  local IFS=','
  for part in $raw; do
    part="${part// /}"
    require_yyyymm "$part" "账单月份"
  done
}
