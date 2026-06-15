---
name: skill-pain2-submission-blocks
description: 痛点2-生成提单文本。从提单预填表 CSV 生成可复制到 FPP 的提单文本块 Markdown。触发词：生成提单文本块、痛点2、提单文本、FPP文本块。
disable-model-invocation: true
---

# Skill：痛点2-生成提单文本

## Purpose

解决「提单录入重复」：预填表 CSV → 规则脚本生成提单文本块，**禁止 LLM 编造字段**。

## Output

- `上传输出/FPP提单文本块_*.md`

## Execute

```bash
bash /data/workspace/amer-fpp-a/knot-chat/run_agent.sh 痛点2
```

或：

```bash
python3 skill-pain2-submission-blocks/scripts/run_pain2.py --root /data/workspace/amer-fpp-a
```

## Guardrails

- 不得口述提单字段内容；引导用户打开 DONE 路径文件复制
- 只复述 `DONE:` 路径

## Additional resources

- [reference.md](reference.md)
