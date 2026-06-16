#!/usr/bin/env bash
# 固定路径同步工蜂代码（禁止智能体自行搜索/clone）
set -euo pipefail

ROOT="/data/workspace/amer-fpp-a"

if [[ ! -d "$ROOT" ]]; then
  echo "ERROR: 目录不存在: $ROOT"
  echo "请在 Knot 工作区绑定工蜂仓库 amer-fpp-a/amer-fpp-a，目录设为 /data/workspace/amer-fpp-a"
  exit 1
fi

cd "$ROOT"

if [[ ! -d .git ]]; then
  echo "ERROR: $ROOT 不是 git 仓库，请在工作区设置里绑定工蜂仓库后重试"
  exit 1
fi

echo "SYNC: git pull origin main @ $ROOT"
git pull origin main
chmod +x knot-chat/*.sh 2>/dev/null || true

if [[ -f knot-chat/run_agent.sh ]]; then
  echo "OK: WORKSPACE_ROOT=$ROOT"
  echo "OK: run_agent.sh 就绪"
else
  echo "ERROR: pull 后仍无 knot-chat/run_agent.sh"
  exit 1
fi
