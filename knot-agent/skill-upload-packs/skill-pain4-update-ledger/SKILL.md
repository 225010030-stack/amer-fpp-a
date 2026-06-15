---
name: skill-pain4-update-ledger
description: 痛点4-台账更新。基于提单预填表对台账 CSV 去重 upsert，避免漏更/重复。触发词：台账更新、痛点4、台账自动更新、更新台账。
disable-model-invocation: true
---

# Skill：痛点4-台账更新

## Purpose

解决「台账漏更/晚更/重复」：规则脚本 upsert，**禁止 LLM 编造台账行**。

## Output

- `上传输出/台账_自动更新_{US|CAN}_*.csv`

## Execute

```bash
bash /data/workspace/amer-fpp-a/knot-chat/run_agent.sh 痛点4
```

## Guardrails

- 只复述脚本 stdout 的 created/updated 和 `DONE:` 路径

## Additional resources

- [reference.md](reference.md)
