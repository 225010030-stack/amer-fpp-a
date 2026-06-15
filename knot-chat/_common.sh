#!/usr/bin/env bash
# Shared helpers for knot-chat scripts (source, do not execute directly).
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEMO_ROOT="$ROOT/测试文档/闭环CSV"
UPLOAD_OUT="$ROOT/上传输出"
PRECHECK_OUT="$ROOT/目录预检输出"
HC_OUT="$ROOT/HC校验输出"

mkdir -p "$UPLOAD_OUT" "$PRECHECK_OUT" "$HC_OUT"

demo_or() {
  local demo="$1"
  local fallback="$2"
  if [[ -f "$demo" ]]; then
    echo "$demo"
  else
    echo "$fallback"
  fi
}

timestamp() {
  date +%Y%m%d_%H%M%S
}
