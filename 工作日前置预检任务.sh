#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT/运行日志"
mkdir -p "$LOG_DIR"

TS="$(date +%Y%m%d_%H%M%S)"
PRECHECK_LOG="$LOG_DIR/工作日前置预检_${TS}.log"
CENTER_REPORT="$ROOT/运行日志/成本中心有效性检查报告_定时_${TS}.md"

{
  echo "[INFO] Start workday precheck: $(date)"
  python3 "$ROOT/check_fpp_files.py" --root "$ROOT" --fix-report || true
  python3 "$ROOT/痛点攻坚实施包/check_cost_centers.py" \
    --source "$ROOT/HC_Analysis_统一模板.csv" \
    --status "$ROOT/痛点攻坚实施包/成本中心状态表模板.csv" \
    --output "$CENTER_REPORT" || true
  echo "[INFO] Done: $(date)"
} | tee "$PRECHECK_LOG"
