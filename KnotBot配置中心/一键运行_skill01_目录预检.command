#!/bin/zsh
set -e
cd "$(dirname "$0")"
python3 ".cursor/skills/skill-01-directory-precheck/scripts/run_precheck.py" --root "."
echo ""
echo "已完成。输出目录：$(pwd)/目录预检输出"
