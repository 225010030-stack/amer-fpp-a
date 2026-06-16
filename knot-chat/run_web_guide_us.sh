#!/usr/bin/env bash
set -euo pipefail
# shellcheck disable=SC1091
source "$(dirname "$0")/_common.sh"

cat <<EOF
【网页入口 · US 区 · upload-docs】

1) 启动：bash $ROOT/knot-chat/start_web.sh
2) 工作区端口预览打开：http://127.0.0.1:18081/upload-docs.html
3) 页面顶部选 **US 区**（不要选 CAN/SG 区）
4) Root Path：/data/workspace/amer-fpp-a
5) 必选账单月 YYYYMM → 上传 CSV → 点按钮 → 页面下载链接

CAN 同事请用 CAN 专用智能体，选 CAN 区。
EOF
