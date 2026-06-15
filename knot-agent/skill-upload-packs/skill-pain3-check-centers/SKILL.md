---
name: skill-pain3-check-centers
description: 痛点3-检查成本中心。对比 Source 与成本中心状态表，输出阻断/待确认清单。触发词：检查成本中心、痛点3、成本中心预检、成本中心有效性。
disable-model-invocation: true
---

# Skill：痛点3-检查成本中心

## Purpose

解决「失效成本中心阻断提单」：提交前规则检查，**禁止 LLM 编造失效中心列表**。

## Output

- `上传输出/成本中心有效性检查报告_{US|CAN}_*.md`

## Execute

```bash
bash /data/workspace/amer-fpp-a/knot-chat/run_agent.sh 痛点3
```

## Guardrails

- 阻断项必须来自报告文件，不得口头列举
- 只复述 `DONE:` 路径

## Additional resources

- [reference.md](reference.md)
