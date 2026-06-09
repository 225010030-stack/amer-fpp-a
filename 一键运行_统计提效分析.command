#!/bin/zsh
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
python3 painpoint_stats_analyzer.py --prefill "./提单预填表模板.csv" --jobs "./bot-gateway/jobs.json"
echo "统计提效分析完成。输出在：$ROOT/上传输出"
