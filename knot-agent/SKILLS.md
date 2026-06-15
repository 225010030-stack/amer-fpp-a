# Knot Skills 配置（智能体开发 → Skills 页）

在 Knot 智能体开发页创建 4 个 Skill，每个 Skill 的说明如下。  
**注意**：Skill 只做说明与路由；实际计算必须由 Client「执行命令」跑 `knot-chat/*.sh`，禁止 LLM 手算。

---

## Skill 1：痛点1-自动分摊

**名称**：痛点1-自动分摊  
**描述**：将成本中心人数 CSV 按账单总额自动分摊，输出 HC_Analysis CSV 并自动 HC 校验。  
**触发词**：自动分摊、痛点1、分摊  
**执行**：
```bash
bash /data/workspace/amer-fpp-a/knot-chat/run_agent.sh 痛点1
```

---

## Skill 2：痛点2-生成提单文本

**名称**：痛点2-生成提单文本  
**描述**：从提单预填表 CSV 生成可复制到 FPP 的提单文本块 Markdown。  
**触发词**：生成提单文本块、痛点2、提单文本  
**执行**：
```bash
bash /data/workspace/amer-fpp-a/knot-chat/run_agent.sh 痛点2
```

---

## Skill 3：痛点3-检查成本中心

**名称**：痛点3-检查成本中心  
**描述**：对比 Source 与成本中心状态表，输出阻断/待确认清单。  
**触发词**：检查成本中心、痛点3、成本中心预检  
**执行**：
```bash
bash /data/workspace/amer-fpp-a/knot-chat/run_agent.sh 痛点3
```

---

## Skill 4：痛点4-台账更新

**名称**：痛点4-台账更新  
**描述**：基于提单预填表对台账 CSV 去重 upsert，避免漏更/重复。  
**触发词**：台账更新、痛点4、台账自动更新  
**执行**：
```bash
bash /data/workspace/amer-fpp-a/knot-chat/run_agent.sh 痛点4
```

---

## 附加 Skill（推荐）：US闭环演示

**名称**：US四痛点闭环演示  
**描述**：用内置样例 CSV 按固定顺序跑通四痛点，适合培训与新同事首次体验。  
**触发词**：US演示、四痛点演示、闭环演示  
**执行**：
```bash
bash /data/workspace/amer-fpp-a/knot-chat/run_agent.sh US演示
```
