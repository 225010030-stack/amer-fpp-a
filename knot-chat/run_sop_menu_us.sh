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

【0】US演示（培训，内置 DEMO_US_* 样例）
【1】目录预检 — 必填 YYYYMM，建议加 US 只查美国目录
    例：目录预检 202607 US
【2】自动分摊 — 必填 YYYYMM + 人数CSV + 账单额（国=US）
    上传命名：IN_US_P1_人数_YYYYMM.csv
    须确认 Vendor/FeeType（不说则默认 Anthem/Medical Insurance）
    例：2 上传输入/IN_US_P1_人数_202607.csv 202607 US 145411.03 Cigna Dental
    可选列表：python3 knot-chat/lookup_vendor.py --country US --list
【3】HC校验 — 上传输出/HC_Analysis_US_*.csv
【4】生成提单文本 — IN_US_P2_提单预填表_YYYYMM.csv
【5】检查成本中心 — Source+Status，region=US
【6】台账更新 — IN_US_P2 + IN_US_P4_台账，region=US
【7】总检查 — 必填 YYYYMM
    例：总检查 202607

顺序：4→2→3→5→6
多文件上传 → 网页入口US（upload-docs 页面选 US 区）
命名说明 → 测试文档/上传命名示例/README.md

---
继续请回复：主菜单 | 0 或 US演示 | 数字 0-7
========================================
EOF
