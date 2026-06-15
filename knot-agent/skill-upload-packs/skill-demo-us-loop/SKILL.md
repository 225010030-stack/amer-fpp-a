---
name: skill-demo-us-loop
description: US四痛点闭环演示。用内置样例 CSV 按固定顺序跑通四痛点，适合培训与新同事首次体验。触发词：US演示、四痛点演示、闭环演示、演示一下、帮助演示。
disable-model-invocation: true
---

# Skill：US四痛点闭环演示

## Purpose

新同事培训 / 验收：一次命令跑通痛点2→1→3→4，全部使用 `测试文档/闭环CSV` 样例，**零幻觉**。

## Execute

```bash
bash /data/workspace/amer-fpp-a/knot-chat/run_agent.sh US演示
```

或：

```bash
python3 skill-demo-us-loop/scripts/run_demo_us.py --root /data/workspace/amer-fpp-a
```

## Output

多个 `上传输出/` 下 DONE 路径（提单文本、HC Analysis、成本中心报告、台账）。

## Guardrails

- 按固定模板回复：执行指令、状态、全部 DONE 路径、下一步
- 不得跳过执行步骤口头描述结果

## Additional resources

- [reference.md](reference.md)
