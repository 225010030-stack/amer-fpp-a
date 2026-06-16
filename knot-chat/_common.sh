#!/usr/bin/env bash
# 严格文件命名规范 — 路径常量（source 由 knot-chat/*.sh 使用）
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 目录
DEMO_ROOT="$ROOT/测试文档/闭环CSV"
TPL_ROOT="$ROOT/测试文档/模板"
UPLOAD_IN="$ROOT/上传输入"
UPLOAD_OUT="$ROOT/上传输出"
PRECHECK_OUT="$ROOT/目录预检输出"
HC_OUT="$ROOT/HC校验输出"
IN_NAMING_GUIDE="$ROOT/测试文档/上传命名示例"

mkdir -p "$UPLOAD_OUT" "$PRECHECK_OUT" "$HC_OUT" "$UPLOAD_IN"

# ---------- 模板 TPL_{国家}_P{环节}_{说明}.csv ----------
TPL_US_P1="$TPL_ROOT/US/TPL_US_P1_人数输入.csv"
TPL_US_P2="$TPL_ROOT/US/TPL_US_P2_提单预填表.csv"
TPL_US_P3_HC="$TPL_ROOT/US/TPL_US_P3_HC源文件.csv"
TPL_US_P3_STATUS="$TPL_ROOT/US/TPL_US_P3_成本中心状态表.csv"
TPL_US_P4="$TPL_ROOT/US/TPL_US_P4_台账.csv"
TPL_US_VENDOR="$TPL_ROOT/US/TPL_US_供应商字段字典.csv"

TPL_CAN_P1="$TPL_ROOT/CAN/TPL_CAN_P1_人数输入.csv"
TPL_CAN_P2="$TPL_ROOT/CAN/TPL_CAN_P2_提单预填表.csv"
TPL_CAN_P3_HC="$TPL_ROOT/CAN/TPL_CAN_P3_HC源文件.csv"
TPL_CAN_P3_STATUS="$TPL_ROOT/CAN/TPL_CAN_P3_成本中心状态表.csv"
TPL_CAN_P4="$TPL_ROOT/CAN/TPL_CAN_P4_台账.csv"
TPL_CAN_VENDOR="$TPL_ROOT/CAN/TPL_CAN_供应商字段字典.csv"

# ---------- 演示 DEMO_{国家}_P{环节}_{说明}_{YYYYMM}.csv ----------
DEMO_US_P1="$DEMO_ROOT/US/DEMO_US_P1_人数输入_202605.csv"
DEMO_US_P2="$DEMO_ROOT/US/DEMO_US_P2_提单预填表_202605.csv"
DEMO_US_P3_HC="$DEMO_ROOT/US/DEMO_US_P3_HC源文件_202605.csv"
DEMO_US_P3_STATUS="$DEMO_ROOT/US/DEMO_US_P3_成本中心状态表_202605.csv"
DEMO_US_P4="$DEMO_ROOT/US/DEMO_US_P4_台账_202605.csv"

DEMO_CAN_P1="$DEMO_ROOT/CAN/DEMO_CAN_P1_人数输入_202605.csv"
DEMO_CAN_P2="$DEMO_ROOT/CAN/DEMO_CAN_P2_提单预填表_202605.csv"
DEMO_CAN_P3_HC="$DEMO_ROOT/CAN/DEMO_CAN_P3_HC源文件_202605.csv"
DEMO_CAN_P3_STATUS="$DEMO_ROOT/CAN/DEMO_CAN_P3_成本中心状态表_202605.csv"
DEMO_CAN_P4="$DEMO_ROOT/CAN/DEMO_CAN_P4_台账_202605.csv"

# ---------- 上传输入命名：IN_{国家}_P{环节}_{说明}_{YYYYMM}.csv ----------
# 示例见 测试文档/上传命名示例/

demo_or() {
  local demo="$1"
  local fallback="$2"
  if [[ -f "$demo" ]]; then
    echo "$demo"
  else
    echo "$fallback"
  fi
}

# 按国家取模板/演示路径：demo_path US P1 | tpl_path CAN P2
demo_path() {
  local country="$1"
  local step="$2"
  country="$(echo "$country" | tr '[:lower:]' '[:upper:]')"
  [[ "$country" == "CA" ]] && country="CAN"
  case "${country}_${step}" in
    US_P1) demo_or "$DEMO_US_P1" "$TPL_US_P1" ;;
    US_P2) demo_or "$DEMO_US_P2" "$TPL_US_P2" ;;
    US_P3_HC) demo_or "$DEMO_US_P3_HC" "$TPL_US_P3_HC" ;;
    US_P3_STATUS) demo_or "$DEMO_US_P3_STATUS" "$TPL_US_P3_STATUS" ;;
    US_P4) demo_or "$DEMO_US_P4" "$TPL_US_P4" ;;
    CAN_P1) demo_or "$DEMO_CAN_P1" "$TPL_CAN_P1" ;;
    CAN_P2) demo_or "$DEMO_CAN_P2" "$TPL_CAN_P2" ;;
    CAN_P3_HC) demo_or "$DEMO_CAN_P3_HC" "$TPL_CAN_P3_HC" ;;
    CAN_P3_STATUS) demo_or "$DEMO_CAN_P3_STATUS" "$TPL_CAN_P3_STATUS" ;;
    CAN_P4) demo_or "$DEMO_CAN_P4" "$TPL_CAN_P4" ;;
    *) echo "ERROR: unknown demo_path ${country} ${step}" >&2; return 1 ;;
  esac
}

tpl_path() {
  local country="$1"
  local step="$2"
  country="$(echo "$country" | tr '[:lower:]' '[:upper:]')"
  [[ "$country" == "CA" ]] && country="CAN"
  case "${country}_${step}" in
    US_P1) echo "$TPL_US_P1" ;;
    US_P2) echo "$TPL_US_P2" ;;
    US_P3_HC) echo "$TPL_US_P3_HC" ;;
    US_P3_STATUS) echo "$TPL_US_P3_STATUS" ;;
    US_P4) echo "$TPL_US_P4" ;;
    CAN_P1) echo "$TPL_CAN_P1" ;;
    CAN_P2) echo "$TPL_CAN_P2" ;;
    CAN_P3_HC) echo "$TPL_CAN_P3_HC" ;;
    CAN_P3_STATUS) echo "$TPL_CAN_P3_STATUS" ;;
    CAN_P4) echo "$TPL_CAN_P4" ;;
    *) echo "ERROR: unknown tpl_path ${country} ${step}" >&2; return 1 ;;
  esac
}

timestamp() {
  date +%Y%m%d_%H%M%S
}

is_yyyymm() {
  [[ "${1:-}" =~ ^20[0-9]{2}(0[1-9]|1[0-2])$ ]]
}

require_yyyymm() {
  local label="${2:-账单期间}"
  local val="${1:-}"
  if ! is_yyyymm "$val"; then
    cat <<EOF
ERROR: 必须指定${label}（6 位 YYYYMM，如 202607）
上传文件命名：IN_US_P1_人数_202607.csv（见 测试文档/上传命名示例/）
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

load_vendor_profile() {
  local country="$1"
  local vendor="${2:-}"
  local fee_type="${3:-}"
  local line
  while IFS= read -r line; do
    eval "$line"
  done < <(python3 "$ROOT/knot-chat/lookup_vendor.py" --country "$country" --vendor "$vendor" --fee-type "$fee_type")
}
