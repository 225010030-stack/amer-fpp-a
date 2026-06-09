#!/bin/zsh
set -e
cd "$(dirname "$0")"

VERSION="${1:-v1.0.1}"
OPERATOR="${2:-anna}"
SUMMARY="${3:-静态网页例行发布}"
CHANGES="${4:-更新前端API地址配置;更新文档}"

python3 "./静态网页交付封存/05-版本发布记录/generate_release_record.py" \
  --version "$VERSION" \
  --operator "$OPERATOR" \
  --summary "$SUMMARY" \
  --changes "$CHANGES"

echo "已生成发布记录。"
