# Knot Skill ZIP 上传包（5 个痛点）

本目录包含 5 个可直接上传到 Knot「上传 Skill → ZIP 包上传」的 Skill 包。

## 一、生成 ZIP

```bash
cd "/Users/zhangwenjing/Desktop/工作提效/knot-agent/skill-upload-packs"
chmod +x build_skill_zips.sh
./build_skill_zips.sh
```

生成位置：`knot-agent/skill-upload-packs/zips/*.zip`

## 二、逐个上传（工作区 → Skills → 上传 Skill）

| 顺序 | ZIP 文件 | 名称 | 使用说明（复制到表单） | 系统标签 |
|------|---------|------|----------------------|---------|
| 1 | `skill-demo-us-loop.zip` | US四痛点闭环演示 | 用内置样例 CSV 按固定顺序跑通四痛点，适合培训与新同事首次体验。触发词：US演示、四痛点演示、闭环演示。 | FPP AMER 演示 培训 |
| 2 | `skill-pain1-allocation.zip` | 痛点1-自动分摊 | 将成本中心人数 CSV 按账单总额自动分摊，输出 HC_Analysis CSV 并自动 HC 校验。触发词：自动分摊、痛点1、分摊。 | FPP AMER 痛点1 分摊 |
| 3 | `skill-pain2-submission-blocks.zip` | 痛点2-生成提单文本 | 从提单预填表 CSV 生成可复制到 FPP 的提单文本块 Markdown。触发词：生成提单文本块、痛点2、提单文本。 | FPP AMER 痛点2 提单 |
| 4 | `skill-pain3-check-centers.zip` | 痛点3-检查成本中心 | 对比 Source 与成本中心状态表，输出阻断/待确认清单。触发词：检查成本中心、痛点3、成本中心预检。 | FPP AMER 痛点3 成本中心 |
| 5 | `skill-pain4-update-ledger.zip` | 痛点4-台账更新 | 基于提单预填表对台账 CSV 去重 upsert，避免漏更/重复。触发词：台账更新、痛点4、台账自动更新。 | FPP AMER 痛点4 台账 |

## 三、每个 ZIP 内部结构

```text
skill-pain1-allocation/
├── SKILL.md          # Skill 元数据 + 执行指令（Knot 读取）
├── reference.md      # 同事/管理员 runbook
└── scripts/
    └── run_pain1.py  # 可选 runner（实际执行 knot-chat 脚本）
```

## 四、上传后必做

1. 智能体开发 → **Skills** → 勾选刚上传的 5 个
2. Client 勾选 **执行命令**
3. Prompt 粘贴 `knot-agent/PROMPT.md`
4. **发布更新**
5. chat 发 **US演示** 验收

## 五、重要说明

- Skill ZIP **不含**业务 Python 主逻辑；主逻辑在工作区 `knot-chat/` + `痛点攻坚实施包/`
- 上传 Skill 前确保工作区已 `git pull` 且有 `knot-chat/run_agent.sh`
- Skill 的 `disable-model-invocation: true` 表示禁止模型跳过工具直接回答
