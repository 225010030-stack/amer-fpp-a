#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p "$ROOT/运行日志"

# 加载 bot-gateway/.env（若存在）
if [[ -f "$ROOT/bot-gateway/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/bot-gateway/.env"
  set +a
fi

export WORKSPACE_ROOT="${WORKSPACE_ROOT:-$ROOT}"

# 启动前同步工蜂最新代码（可通过 AUTO_SYNC_ON_RUN=false 关闭）
if [[ "${AUTO_SYNC_ON_RUN:-true}" == "true" ]]; then
  bash "$ROOT/knot-chat/sync_workspace.sh" || true
fi

nohup python3 -m uvicorn main:app --app-dir bot-gateway --host 0.0.0.0 --port 18082 > "$ROOT/运行日志/backend.log" 2>&1 &
nohup python3 -m http.server 18081 --directory web-tool > "$ROOT/运行日志/web.log" 2>&1 &
echo "DONE: backend http://127.0.0.1:18082/api/health"
echo "DONE: web http://127.0.0.1:18081/upload-docs.html"
echo "DONE: menu http://127.0.0.1:18081/chat-menu.html"
echo "DONE: WORKSPACE_ROOT=$WORKSPACE_ROOT"
