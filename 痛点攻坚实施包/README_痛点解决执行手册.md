# 痛点解决执行手册（先痛点，后优化）

本实施包对应你的4个痛点，目标是让同事“按命令执行、按文件留痕”。

## 痛点1：手工分摊耗时且易错（High）

输入文件：
- `成本中心人数输入模板.csv`

执行命令（示例）：

```bash
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
```

再执行校验：

```bash
python3 "./check_hc_analysis.py" --file "./HC_Analysis_自动生成_示例.csv"
```

---

## 痛点2：提单录入重复、效率低（High）

输入文件：
- `提单预填表模板.csv`

执行命令：

```bash
python3 "./generate_fpp_submission_blocks.py" \
  --input "./提单预填表模板.csv" \
  --output "./FPP提单文本块.md"
```

输出：
- `FPP提单文本块.md`（可复制提单字段块）

---

## 痛点3：成本中心失效导致无法提单（Medium）

输入文件：
- 待提单源文件（例如 `HC_Analysis_自动生成_示例.csv` 或提单预填表）
- `成本中心状态表模板.csv`（先替换成真实状态表）

执行命令：

```bash
python3 "./痛点攻坚实施包/check_cost_centers.py" \
  --source "./HC_Analysis_自动生成_示例.csv" \
  --status "./痛点攻坚实施包/成本中心状态表模板.csv" \
  --output "./成本中心有效性检查报告.md"
```

输出：
- `成本中心有效性检查报告.md`（阻断项 + 待确认项）

---

## 痛点4：台账漏更/晚更/重复（Low）

输入文件：
- `提单预填表模板.csv`
- `台账模板.csv`（首次）或既有台账

执行命令：

```bash
python3 "./痛点攻坚实施包/update_ledger.py" \
  --prefill "./提单预填表模板.csv" \
  --ledger "./台账_自动更新.csv"
```

输出：
- `台账_自动更新.csv`（去重upsert后的台账）

---

## 执行顺序（固定）

1. `build_hc_allocation.py` + `check_hc_analysis.py`  
2. `generate_fpp_submission_blocks.py`  
3. `check_cost_centers.py`  
4. `update_ledger.py`

---

## 同事只需知道的“最少文件”

- `成本中心人数输入模板.csv`
- `提单预填表模板.csv`
- `成本中心状态表模板.csv`
- `台账模板.csv`
- `README_痛点解决执行手册.md`
