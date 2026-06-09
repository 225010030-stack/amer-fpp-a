#!/bin/zsh
set -e

cd "$(dirname "$0")"
ROOT="$(pwd)"

echo "启动后端服务 (18082)..."
osascript -e "tell application \"Terminal\" to do script \"cd \\\"${ROOT}/bot-gateway\\\" && python3 -m uvicorn main:app --host 0.0.0.0 --port 18082 --reload\""

echo "启动网页服务 (18081)..."
osascript -e "tell application \"Terminal\" to do script \"cd \\\"${ROOT}/web-tool\\\" && python3 -m http.server 18081\""

echo "已启动。请打开: http://127.0.0.1:18081/index.html"
