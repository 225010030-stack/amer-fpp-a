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

# Knot 预览默认映射 18081 → 网页+API 同端口（uvicorn 托管 web-tool）
SERVICE_PORT="${SERVICE_PORT:-18081}"
nohup python3 -m uvicorn main:app --app-dir bot-gateway --host 0.0.0.0 --port "$SERVICE_PORT" > "$ROOT/运行日志/backend.log" 2>&1 &
sleep 1

WEB_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${SERVICE_PORT}/upload-docs.html" 2>/dev/null || echo "000")
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${SERVICE_PORT}/api/health" 2>/dev/null || echo "000")

echo "DONE: ★Knot 预览用端口 ${SERVICE_PORT}（网页+API 同域）"
echo "DONE: http://127.0.0.1:${SERVICE_PORT}/upload-docs.html (HTTP $WEB_CODE)"
echo "DONE: http://127.0.0.1:${SERVICE_PORT}/api/health (HTTP $API_CODE)"
echo "DONE: http://127.0.0.1:${SERVICE_PORT}/chat-menu.html"
echo "DONE: WORKSPACE_ROOT=$WORKSPACE_ROOT"
if [[ "$WEB_CODE" != "200" || "$API_CODE" != "200" ]]; then
  echo "WARN: 服务未就绪，查看 运行日志/backend.log"
fi
