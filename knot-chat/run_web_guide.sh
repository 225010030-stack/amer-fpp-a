#!/usr/bin/env bash
# 告诉同事如何打开网页四按钮入口
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"

cat <<EOF
【网页入口 · upload-docs 四按钮】

适用：需要拖拽上传多个 CSV、填写 Period/Invoice Total 等表单时。

1) 在工作区终端启动（若未启动）：
   bash $ROOT/knot-chat/start_web.sh

2) 健康检查：
   curl http://127.0.0.1:18082/api/health

3) 浏览器打开（内网部署后替换域名）：
   http://127.0.0.1:18081/upload-docs.html   ← 多文件上传四按钮
   http://127.0.0.1:18081/chat-menu.html    ← ★ 点击选择菜单（HR同款）

4) 页面对应关系：
   - 成本中心预检 → 自动分摊生成HC / 检查成本中心
   - 文档产出 → 生成提单文本 / HC校验
   - 台账回填 → 台账自动更新

5) Root Path 填：/data/workspace/amer-fpp-a（或 /app）

日常简单操作仍推荐 chat 发：主菜单 / 自动分摊 / 检查成本中心
EOF
