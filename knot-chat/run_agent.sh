#!/usr/bin/env bash
# 确定性指令路由：同事在 Knot chat 发指令 → 智能体只调用本脚本，禁止 LLM 自行编造结果
# 用法：bash run_agent.sh <指令关键词> [参数...]
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"

CMD="${1:-帮助}"
shift || true

run_help() {
  cat <<'EOF'
AMER FPP 四痛点指令（复制到 Knot chat 即可）：

【预检类】
  目录预检              检查 FPP 目录结构（默认当前月）
  HC校验                校验 HC Analysis CSV
  总检查                目录预检 + HC校验

【四痛点】
  痛点1 / 自动分摊      生成 HC_Analysis CSV（默认演示样例）
  痛点2 / 生成提单文本块  生成 FPP 提单文本块 MD
  痛点3 / 检查成本中心    成本中心有效性报告
  痛点4 / 台账更新        台账自动 upsert

【演示】
  US演示 / 四痛点演示     按固定顺序跑 US 闭环样例

规则：所有结果以脚本 stdout 中 DONE: 路径为准，禁止口头编造。
EOF
}

case "$CMD" in
  帮助|help|--help|-h)
    run_help
    ;;
  目录预检|预检|precheck)
    bash "$ROOT/knot-chat/run_precheck.sh" "$@"
    ;;
  HC校验|hc校验|hc检查|hc_check)
    bash "$ROOT/knot-chat/run_hc_check.sh" "$@"
    ;;
  总检查|full_check)
    bash "$ROOT/knot-chat/run_full_check.sh" "$@"
    ;;
  痛点1|自动分摊|分摊|pain1)
    bash "$ROOT/knot-chat/run_pain1_allocation.sh" "$@"
    ;;
  痛点2|生成提单文本块|提单文本块|pain2)
    bash "$ROOT/knot-chat/generate_submission_blocks.sh" "$@"
    ;;
  痛点3|检查成本中心|成本中心检查|pain3)
    bash "$ROOT/knot-chat/run_pain3_check_centers.sh" "$@"
    ;;
  痛点4|台账更新|台账自动更新|pain4)
    bash "$ROOT/knot-chat/run_pain4_update_ledger.sh" "$@"
    ;;
  US演示|四痛点演示|demo_us|闭环演示)
    bash "$ROOT/knot-chat/run_demo_us.sh"
    ;;
  *)
    echo "ERROR: 未知指令 [$CMD]"
    run_help
    exit 2
    ;;
esac
