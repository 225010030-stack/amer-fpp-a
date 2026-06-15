# Skill Runbook：痛点1-自动分摊

## Knot 上传表单填写

| 字段 | 填写内容 |
|------|---------|
| **名称** | `痛点1-自动分摊` |
| **上传方式** | ZIP 包上传 → `skill-pain1-allocation.zip` |
| **使用说明** | 将成本中心人数 CSV 按账单总额自动分摊，输出 HC_Analysis CSV 并自动 HC 校验。触发词：自动分摊、痛点1、分摊。 |
| **系统标签** | `FPP` `AMER` `痛点1` `分摊` |

## 推荐执行命令

```bash
bash /data/workspace/amer-fpp-a/knot-chat/run_agent.sh 痛点1
```

## 带自定义文件

```bash
bash /data/workspace/amer-fpp-a/knot-chat/run_agent.sh 痛点1 \
  /data/workspace/amer-fpp-a/上传输入/人数.csv 202606 US 145411.03
```

## 输出

- `上传输出/HC_Analysis_US_YYYYMMDD_HHMMSS.csv`

## 验收

stdout 含 `DONE:` 且 HC 校验通过（ERROR: 0）。
