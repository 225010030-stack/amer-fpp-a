#!/usr/bin/env bash
# US 专用主菜单
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"

cat <<'EOF'
========================================
  AMER FPP · 美国 US 专用主菜单
========================================
本流程仅 US。加拿大请发 **CAN主菜单**。

请回复数字或关键词。结果以 DONE: 为准。

【0】US演示（培训，内置样例）
【1】目录预检 — 必填 YYYYMM，建议加 US 只查美国目录
    例：目录预检 202607 US
【2】自动分摊 — 必填 YYYYMM + 人数CSV + 账单额（国=US）
    须确认 Vendor/FeeType（不说则默认 Anthem/Medical Insurance）
    例：2 上传输入/人数_US.csv 202607 US 145411.03 Cigna Dental
    可选列表：python3 knot-chat/lookup_vendor.py --country US --list
【3】HC校验 — HC_Analysis_US_*.csv
【4】生成提单文本 — US 提单预填表
【5】检查成本中心 — Source+Status，region=US
【6】台账更新 — Prefill+Ledger，region=US
【7】总检查 — 必填 YYYYMM
    例：总检查 202607

顺序：4→2→3→5→6
多文件上传 → 网页入口US（upload-docs 页面选 US 区）

---
继续请回复：主菜单 | 0 或 US演示 | 数字 0-7
========================================
EOF
