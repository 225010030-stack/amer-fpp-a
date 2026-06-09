#!/bin/zsh
set -e
cd "$(dirname "$0")"

python3 "./痛点攻坚实施包/build_hc_allocation.py" \
  --input "./痛点攻坚实施包/成本中心人数输入模板.csv" \
  --output "./HC_Analysis_自动生成_示例.csv" \
  --period 202606 \
  --country US \
  --entity "Tencent America LLC" \
  --vendor "Anthem" \
  --fee-type "Medical Insurance" \
  --invoice-total 145411.03 \
  --currency USD

python3 "./check_hc_analysis.py" --file "./HC_Analysis_自动生成_示例.csv"

python3 "./generate_fpp_submission_blocks.py" \
  --input "./提单预填表模板.csv" \
  --output "./FPP提单文本块.md"

python3 "./痛点攻坚实施包/check_cost_centers.py" \
  --source "./HC_Analysis_自动生成_示例.csv" \
  --status "./痛点攻坚实施包/成本中心状态表模板.csv" \
  --output "./成本中心有效性检查报告.md"

python3 "./痛点攻坚实施包/update_ledger.py" \
  --prefill "./提单预填表模板.csv" \
  --ledger "./台账_自动更新.csv"

echo "完成：已生成分摊、提单文本、成本中心报告、自动台账。"
