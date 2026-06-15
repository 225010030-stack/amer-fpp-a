#!/usr/bin/env bash
# 打包 5 个 Knot Skill ZIP（平台上传格式）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="$ROOT/zips"
mkdir -p "$OUT"

pack() {
  local name="$1"
  local dir="$ROOT/$name"
  local zip="$OUT/${name}.zip"
  rm -f "$zip"
  (cd "$ROOT" && zip -r "$zip" "$name" -x "*.DS_Store")
  echo "OK: $zip"
}

for skill in \
  skill-pain1-allocation \
  skill-pain2-submission-blocks \
  skill-pain3-check-centers \
  skill-pain4-update-ledger \
  skill-demo-us-loop
do
  pack "$skill"
done

echo ""
echo "ZIP 文件目录: $OUT"
ls -la "$OUT"
