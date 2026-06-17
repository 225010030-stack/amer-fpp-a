#!/usr/bin/env bash
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
【网页入口 · CAN · 2.0 操作台】

1) 启动：bash $ROOT/knot-chat/start_web.sh
2) 预览链接（端口 ${PORT}）：${PREVIEW}/upload-docs.html
3) 左侧选 **CAN 工作区** → 步骤 0 建批次 → 按 2.0 顺序操作
4) Root Path：/data/workspace/amer-fpp-a
5) 运营看板：页面顶部 Tab「运营看板」

chat：CAN主菜单 | CAN演示 | 网页入口CAN
EOF
