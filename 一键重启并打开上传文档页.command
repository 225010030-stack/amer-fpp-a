#!/bin/zsh
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT/bot-gateway"
FRONTEND_DIR="$ROOT/web-tool"
BACKEND_PORT=18082
FRONTEND_PORT=18081
PAGE_URL="http://127.0.0.1:${FRONTEND_PORT}/upload-docs.html"

echo "释放端口 ${BACKEND_PORT} / ${FRONTEND_PORT} ..."
lsof -ti tcp:${BACKEND_PORT} | xargs kill -9 2>/dev/null || true
lsof -ti tcp:${FRONTEND_PORT} | xargs kill -9 2>/dev/null || true

echo "启动后端服务 (${BACKEND_PORT}) ..."
osascript -e "tell application \"Terminal\" to do script \"cd \\\"${BACKEND_DIR}\\\" && python3 -m uvicorn main:app --host 0.0.0.0 --port ${BACKEND_PORT} --reload\""

echo "启动前端服务 (${FRONTEND_PORT}) ..."
osascript -e "tell application \"Terminal\" to do script \"cd \\\"${FRONTEND_DIR}\\\" && python3 -m http.server ${FRONTEND_PORT}\""

sleep 2
echo "打开页面: ${PAGE_URL}"
open "${PAGE_URL}"

echo "完成。"
