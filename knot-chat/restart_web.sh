#!/usr/bin/env bash
# 重启网页+API，并打印 Knot 预览所需检查结果
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p "$ROOT/运行日志"

kill_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids=$(lsof -ti:"$port" 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
      # shellcheck disable=SC2086
      kill -9 $pids 2>/dev/null || true
    fi
  elif command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" 2>/dev/null || true
  fi
}

echo "=== 1) 释放端口 18081 / 18082 ==="
kill_port 18081
kill_port 18082
sleep 1

echo "=== 2) 启动服务 ==="
bash "$ROOT/knot-chat/start_web.sh"
sleep 2

echo ""
echo "=== 3) 本机健康检查（必须在 Knot 工作区终端跑） ==="
WEB_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18081/upload-docs.html || echo "000")
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18082/api/health || echo "000")
echo "upload-docs.html  HTTP $WEB_CODE  (期望 200)"
echo "api/health        HTTP $API_CODE  (期望 200)"

if [[ "$WEB_CODE" != "200" || "$API_CODE" != "200" ]]; then
  echo ""
  echo "ERROR: 服务未就绪，查看日志："
  echo "  tail -30 $ROOT/运行日志/backend.log"
  echo "  tail -30 $ROOT/运行日志/web.log"
  exit 1
fi

echo ""
echo "=== 4) Knot 预览链接怎么填 ==="
echo "预览端口选 18081（网页），浏览器路径必须带："
echo "  /upload-docs.html"
echo ""
echo "若页面 Health Check 失败，还需为 18082 单独生成预览链接，"
echo "填到 upload-docs 页顶 Backend URL。"
echo ""
echo "本机测试（仅 Knot 终端内有效，Mac 浏览器打不开）："
echo "  http://127.0.0.1:18081/upload-docs.html"
echo "  http://127.0.0.1:18082/api/health"
