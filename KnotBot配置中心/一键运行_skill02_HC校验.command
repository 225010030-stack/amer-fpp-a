#!/bin/zsh
set -e
cd "$(dirname "$0")"
python3 ".cursor/skills/skill-02-hc-analysis-check/scripts/run_hc_check.py" --root "."
echo ""
echo "已完成。输出目录：$(pwd)/HC校验输出"
