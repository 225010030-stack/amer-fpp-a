#!/usr/bin/env bash
# CAN 专用主菜单
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"

cat <<'EOF'
========================================
  AMER FPP · 加拿大 CAN 专用主菜单
========================================
本流程仅 CAN。美国请发 **US主菜单**。

请回复数字或关键词。结果以 DONE: 为准。

【0】CAN演示（培训，内置 DEMO_CAN_* 样例）
【1】目录预检 — 必填 YYYYMM，建议加 CAN 只查加拿大目录
    例：目录预检 202607 CAN
【2】自动分摊 — 必填 YYYYMM + 人数CSV + 账单额（国=CAN）
    上传命名：IN_CAN_P1_人数_YYYYMM.csv
    默认 SunLife / Medical Insurance / CAD
    例：2 上传输入/IN_CAN_P1_人数_202607.csv 202607 CAN 50000
【3】HC校验 — 上传输出/HC_Analysis_CAN_*.csv
【4】生成提单文本 — IN_CAN_P2_提单预填表_YYYYMM.csv
【5】检查成本中心 — Source+Status，region=CAN
【6】台账更新 — IN_CAN_P2 + IN_CAN_P4_台账，region=CAN
【7】总检查 — 必填 YYYYMM
    例：总检查 202607

顺序：4→2→3→5→6
多文件上传 → 网页入口CAN（upload-docs 页面选 CAN 区）
命名说明 → 测试文档/上传命名示例/README.md

---
继续请回复：主菜单 | 0 或 CAN演示 | 数字 0-7
========================================
EOF
