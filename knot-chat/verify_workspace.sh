#!/usr/bin/env bash
# 探测 Knot 工作区实际根路径（仓库可能在子目录或 workspace 根）
set -euo pipefail

CANDIDATES=(
  "/data/workspace/amer-fpp-a"
  "/data/workspace/amer_fpp_a"
  "/data/workspace"
)

echo "=== AMER FPP 工作区探测 ==="
echo "当前用户: $(whoami 2>/dev/null || echo unknown)"
echo "当前目录: $(pwd 2>/dev/null || echo unknown)"
echo ""
echo "/data/workspace 内容:"
ls -la /data/workspace/ 2>/dev/null || echo "(无法访问 /data/workspace)"
echo ""

for ROOT in "${CANDIDATES[@]}"; do
  if [[ -f "$ROOT/knot-chat/run_agent.sh" ]]; then
    echo "OK: WORKSPACE_ROOT=$ROOT"
    echo "OK: run_agent.sh 存在"
    echo ""
    echo "快速验收:"
    echo "  bash $ROOT/knot-chat/run_agent.sh 主菜单"
    echo "  bash $ROOT/knot-chat/run_agent.sh US演示"
    exit 0
  fi
done

echo "ERROR: 未找到 knot-chat/run_agent.sh"
echo "请在工作区终端执行:"
echo "  cd /data/workspace && git clone https://git.woa.com/amer-fpp-a/amer-fpp-a.git"
echo "或确认 Knot 工作区已绑定工蜂仓库并同步"
exit 1
