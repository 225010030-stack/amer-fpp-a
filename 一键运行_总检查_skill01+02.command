#!/bin/zsh
set -e

cd "$(dirname "$0")"

echo "=== Step 1/2: 目录预检（Skill-01）==="
python3 ".cursor/skills/skill-01-directory-precheck/scripts/run_precheck.py" --root "."

echo ""
echo "=== Step 2/2: HC 校验（Skill-02）==="
python3 ".cursor/skills/skill-02-hc-analysis-check/scripts/run_hc_check.py" --root "."

echo ""
echo "全部完成。输出文件夹："
echo "1) $(pwd)/目录预检输出"
echo "2) $(pwd)/HC校验输出"
