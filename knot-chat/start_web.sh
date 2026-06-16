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

kill_port() {
  local port="$1"
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" 2>/dev/null || true
  elif command -v lsof >/dev/null 2>&1; then
    local pids
    pids=$(lsof -ti:"$port" 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
      # shellcheck disable=SC2086
      kill -9 $pids 2>/dev/null || true
    fi
  fi
}

# 避免重复 start 导致 address already in use
kill_port 18081
kill_port 18082
sleep 1

# 启动前同步工蜂最新代码（可通过 AUTO_SYNC_ON_RUN=false 关闭）
if [[ "${AUTO_SYNC_ON_RUN:-true}" == "true" ]]; then
  bash "$ROOT/knot-chat/sync_workspace.sh" || true
fi

nohup python3 -m uvicorn main:app --app-dir bot-gateway --host 0.0.0.0 --port 18082 > "$ROOT/运行日志/backend.log" 2>&1 &
nohup python3 -m http.server 18081 --directory web-tool > "$ROOT/运行日志/web.log" 2>&1 &
sleep 1

WEB_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18081/upload-docs.html 2>/dev/null || echo "000")
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18082/api/health 2>/dev/null || echo "000")
UNIFIED_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18082/upload-docs.html 2>/dev/null || echo "000")

echo "DONE: backend http://127.0.0.1:18082/api/health (HTTP $API_CODE)"
echo "DONE: web     http://127.0.0.1:18081/upload-docs.html (HTTP $WEB_CODE)"
echo "DONE: ★预览请用 18082 单端口（网页+API同域）: http://127.0.0.1:18082/upload-docs.html (HTTP $UNIFIED_CODE)"
echo "DONE: menu http://127.0.0.1:18082/chat-menu.html"
echo "DONE: WORKSPACE_ROOT=$WORKSPACE_ROOT"
if [[ "$API_CODE" != "200" || "$UNIFIED_CODE" != "200" ]]; then
  echo "WARN: 服务未就绪，查看 运行日志/backend.log 与 web.log"
fi
