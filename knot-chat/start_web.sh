#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
nohup python3 -m uvicorn main:app --app-dir bot-gateway --host 0.0.0.0 --port 18082 > "$ROOT/运行日志/backend.log" 2>&1 &
nohup python3 -m http.server 18081 --directory web-tool > "$ROOT/运行日志/web.log" 2>&1 &
echo "DONE: backend http://127.0.0.1:18082/api/health"
echo "DONE: web http://127.0.0.1:18081/upload-docs.html"
