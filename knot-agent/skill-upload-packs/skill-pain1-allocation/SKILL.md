---
name: skill-pain1-allocation
description: 痛点1-自动分摊。将成本中心人数 CSV 按账单总额自动分摊，输出 HC_Analysis CSV 并自动 HC 校验。触发词：自动分摊、痛点1、分摊、生成HC。
disable-model-invocation: true
---

# Skill：痛点1-自动分摊

## Purpose

解决「手工分摊耗时且易错」：人数 CSV + 账单参数 → 规则脚本生成 HC Analysis，**禁止 LLM 手算金额**。

## Input

- 默认使用工作区演示样例 CSV（`测试文档/闭环CSV/公共/...`）
- 可选：自定义 `--input` CSV、`--period`（202606）、`--country`（US）、`--invoice-total`

## Output（仅以文件为准）

- `上传输出/HC_Analysis_{US|CAN}_*.csv`

## Execute（必须调用 Client「执行命令」）

工作区根路径：`/data/workspace/amer-fpp-a`

```bash
bash /data/workspace/amer-fpp-a/knot-chat/run_agent.sh 痛点1
```

或使用 Skill 脚本：

```bash
python3 skill-pain1-allocation/scripts/run_pain1.py --root /data/workspace/amer-fpp-a
```

## Guardrails

- 不得编造分摊金额、行数、成本中心
- 只复述 stdout 中 `DONE:` 路径
- 失败时建议用户发「US演示」或检查输入 CSV

## Additional resources

- [reference.md](reference.md)
