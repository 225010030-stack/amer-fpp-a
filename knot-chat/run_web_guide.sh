#!/usr/bin/env bash
# 告诉同事如何打开网页 2.0 操作台（upload-docs）
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"

if [[ -f "$ROOT/bot-gateway/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/bot-gateway/.env"
  set +a
fi
PORT="${SERVICE_PORT:-18081}"
PREVIEW="${PUBLIC_WEB_BASE:-http://127.0.0.1:${PORT}}"

cat <<EOF
【网页入口 · AMER FPP 2.0 操作台】

适用：批次向导、台账/人力/CC/分摊、运营看板；多 CSV 拖拽上传。

1) 在工作区终端启动（管理员，只需一次）：
   bash $ROOT/knot-chat/start_web.sh

2) Knot 集成页 → 生成服务预览链接 → 端口 **${PORT}**（端口预览，非文件预览）

3) 同事打开：
   ${PREVIEW}/upload-docs.html
   ${PREVIEW}/chat-menu.html   ← 点击选菜单（可选）

4) 2.0 步骤（US/CAN 各自独立）：
   0 账期批次 → 1 台账+去重 → 2 人力OU → 3 CC检查
   → 5 分摊 → 4 账单核对(可选) → 6 提单输出
   顶部 Tab「运营看板」= US/CAN 汇总

5) Root Path：/data/workspace/amer-fpp-a

chat 分流：网页入口US | 网页入口CAN | 主菜单
EOF
