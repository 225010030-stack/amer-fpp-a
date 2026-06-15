# AMER FPP 四痛点 · Knot 智能体部署手册（防幻觉版）

目标：同事在 Knot chat 发「痛点1 / 自动分摊 / US演示」等指令 → **只跑规则脚本** → 回复真实 `DONE:` 文件路径，**禁止 LLM 编造结果**。

---

## 架构（三层）

```text
同事 Knot Chat
    ↓ Client「执行命令」
knot-chat/run_agent.sh（确定性路由，无 LLM）
    ↓
Python 脚本（build_hc_allocation / check_cost_centers / …）
    ↓
上传输出/*.csv / *.md（可复核留痕）
```

| 层 | 作用 | 防幻觉 |
|----|------|--------|
| Prompt | 强制先执行、只复述 stdout | ✅ |
| run_agent.sh | 关键词→固定脚本 | ✅ |
| Python | 规则计算 | ✅ |

---

## 仓库目录（工蜂 / 工作区）

```text
amer-fpp-a/
├── knot-agent/              # ★ 智能体配置（Prompt/Skills/同事指南）
│   ├── PROMPT.md            # 粘贴到 Knot 智能体开发页
│   ├── SKILLS.md            # 4+1 个 Skill 说明
│   ├── COLLEAGUE_CHAT_GUIDE.md
│   └── command-map.json
├── knot-chat/               # ★ 执行层（Linux shell）
│   ├── run_agent.sh         # 统一入口（推荐）
│   ├── run_pain1_allocation.sh
│   ├── run_pain3_check_centers.sh
│   ├── run_pain4_update_ledger.sh
│   ├── run_demo_us.sh       # US 四痛点闭环演示
│   └── …
├── 痛点攻坚实施包/          # Python 核心
├── 测试文档/闭环CSV/        # 演示样例（US演示 用）
├── bot-gateway/             # webhook/网页 API（可选）
└── web-tool/upload-docs.html
```

工作区路径：`/data/workspace/amer-fpp-a`

---

## 一、工蜂 push

```bash
cd "/Users/zhangwenjing/Desktop/工作提效"
git add knot-agent/ knot-chat/ bot-gateway/ 测试文档/ 痛点攻坚实施包/
git add bot-gateway/main.py bot-gateway/config/command-map.json
git add KNOT_AGENT_四痛点智能体部署.md
git commit -m "feat: knot agent system for four pain points with anti-hallucination routing"
git push workbee main
```

Knot 工作区终端更新：

```bash
cd /data/workspace/amer-fpp-a
git pull origin main
chmod +x knot-chat/*.sh
```

---

## 二、Knot 智能体配置（必做 4 项）

### 1) 工作区

- 工作区：`amer-fpp-a`（或 `amer_fpp_a`）
- 工蜂仓库已绑定，`git pull` 后有 `knot-agent/`、`knot-chat/`

### 2) Client 工具

勾选：
- **执行命令**（必须）
- **读取文件**（建议，便于打开 DONE 报告）

### 3) Skills（可选但推荐）

按 `knot-agent/SKILLS.md` 创建 5 个 Skill（痛点1-4 + US演示）。

### 4) Prompt

**完整复制** `knot-agent/PROMPT.md` → 智能体开发页 → **发布更新**。

核心规则：
- 必须先「执行命令」
- 只认 `DONE:` 路径
- 禁止编造金额/成本中心/检查结果

---

## 三、同事怎么用（chat 指令）

详见 `knot-agent/COLLEAGUE_CHAT_GUIDE.md`。

| 发这句话 | 效果 |
|---------|------|
| **帮助** | 列出全部指令 |
| **US演示** | 样例 CSV 跑通四痛点（培训首选） |
| **自动分摊** | 痛点1 → HC_Analysis CSV |
| **生成提单文本块** | 痛点2 → FPP 文本块 MD |
| **检查成本中心** | 痛点3 → 有效性报告 MD |
| **台账更新** | 痛点4 → 台账 CSV |
| **目录预检** | FPP 目录结构检查 |

---

## 四、验收清单

- [ ] `bash knot-chat/run_agent.sh 帮助` 有输出
- [ ] `bash knot-chat/run_agent.sh US演示` 四个 DONE 路径
- [ ] chat 发「US演示」回复含 4 个输出文件路径
- [ ] chat 发「自动分摊」回复含 `HC_Analysis_*.csv`
- [ ] 智能体未执行命令时不会假装「已完成」

---

## 五、工蜂项目设置（已做过可跳过）

工蜂仓库 → 设置 → 基础设置：
- 全部可见
- **允许使用外部工具**
- 非保密项目

否则 Knot 工作区无法 clone。

---

## 六、与网页版关系

| 入口 | 适合 |
|------|------|
| **Knot chat** | 同事日常：发指令、看 DONE 路径 |
| **upload-docs.html** | 需要上传多 CSV + 表单参数时 |

两者共用同一套 Python 脚本，结果一致。

---

## 七、常见报错

| 现象 | 处理 |
|------|------|
| 智能体只聊天不执行 | 检查 Client「执行命令」+ Prompt 已发布 |
| No month directories | 目录预检已默认当前月；或传 `202606` |
| 文件 not found | `git pull` + 确认 `测试文档/` 存在 |
| clone 被拒绝 | 工蜂「允许外部工具」+ 等 5 分钟 |
