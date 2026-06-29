# AMER FPP · AI 工作台与组织建设说明

> 适用对象：流程负责人、操作者、Knot 配置人、内网部署维护人  
> 版本：v1.0 · 2026-06  
> 关联仓库：`amer-fpp-a`（工蜂） · 工作区 `/data/workspace/amer-fpp-a`

---

## 目录

1. [文档目的](#1-文档目的)
2. [整体架构：三层分工](#2-整体架构三层分工)
3. [AI Native 四阶段演进](#3-ai-native-四阶段演进)
4. [核心概念：MCP、Skill、插件](#4-核心概念mcpskill插件)
5. [网页工作台 vs Knot 智能体](#5-网页工作台-vs-knot-智能体)
6. [按钮接什么：不是每个按钮都嵌 Agent](#6-按钮接什么不是每个按钮都嵌-agent)
7. [校招团队逻辑对照（学习参考）](#7-校招团队逻辑对照学习参考)
8. [本项目的文件与入口](#8-本项目的文件与入口)
9. [开发与迭代方式](#9-开发与迭代方式)
10. [部署：工蜂、服务器、Knot 各干什么](#10-部署工蜂服务器knot-各干什么)
11. [启动与调用清单](#11-启动与调用清单)
12. [安全与合规要点](#12-安全与合规要点)
13. [路线图建议](#13-路线图建议)
14. [附录：常见问题](#14-附录常见问题)

---

## 1. 文档目的

本文档说明 AMER FPP 团队如何理解并建设「AI 工作台 + Knot 智能体 + 脚本后端」体系，并参考校招中心 AI Native 组织建设思路，明确：

- **网页操作台**与 **Knot 对话**各自职责；
- **工蜂**存代码、**服务器**跑服务、**Knot 平台**跑智能体；
- 如何从 **网页 Demo** 起步，逐步叠加 API、数据底座与 Agent 能力。

---

## 2. 整体架构：三层分工

```
┌─────────────────────────────────────────────────────────────┐
│  展示与入口层（给人用）                                        │
│  portal / upload-docs / chat-menu  │  Knot 智能体（Anna）      │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP / 链接
┌───────────────────────────▼─────────────────────────────────┐
│  执行与 API 层                                               │
│  bot-gateway (FastAPI :18082)  →  knot-chat/*.sh  →  Python  │
└───────────────────────────┬─────────────────────────────────┘
                            │ 文件落盘
┌───────────────────────────▼─────────────────────────────────┐
│  数据与上下文层（当前 + 未来）                                 │
│  上传输出/*.csv、*.md  │  jobs.json  │  未来：FPP MCP         │
└─────────────────────────────────────────────────────────────┘
```

| 层级 | 组件 | 作用 |
|------|------|------|
| 展示层 | `web-tool/*.html` | 按钮、表单、看板；**不是聊天 AI** |
| 展示层 | Knot 智能体 | 对话引导、复杂问答、Client 执行命令 |
| 执行层 | `bot-gateway` | 白名单 action、跑脚本、记录 jobs |
| 执行层 | `knot-chat/*.sh` | 确定性计算（分摊、预检、台账等） |
| 数据层 | 输出目录 + jobs | 审计、复盘；未来结构化 MCP |

**原则**：分摊、校验、台账等 **计算由脚本完成**；模型只做 **路由、说明、综合问答**（且须遵守防幻觉规则）。

---

## 3. AI Native 四阶段演进

参考校招中心路径，FPP/SSC 可对标如下：

| 阶段 | 名称 | 校招做法 | FPP 现状 | 下一步 |
|------|------|----------|----------|--------|
| 1 | 工具辅助 | WorkBuddy 个人提效 | Knot + Skills + 脚本 | 已具备 |
| 2 | 信息聚合 | 校招 AI 操作台 | `upload-docs.html`、主菜单 | 加 portal 门户页 |
| 3 | 上下文打通 | 三类 MCP | 文件落盘、jobs.json | 建 FPP 过程 MCP |
| 4 | 智能协同 | Multi-Agent | US/CAN 分流程 | 专科 Agent + 关账晨会 |

**AI Native ≠ 用了 AI**：是把工作流、数据、知识沉淀为 **组织级上下文**，让 AI 持续参与预检、提醒与归因，人做最终判断。

**组织自检 8 指标**（节选）：决策是否有证据链、工作流是否 Pipeline 化、上下文是否可串链、AI 建议是否可追踪、数据是否有字段与权限、异常响应是否及时、是否形成固定人机协作、经验是否跨月复用。

---

## 4. 核心概念：MCP、Skill、插件

### 4.1 一句话区分

| 概念 | 本质 | 类比 |
|------|------|------|
| **Skill** | 教 AI **何时、怎么做** 的 SOP | 岗位操作手册 |
| **MCP** | 给 AI **读写业务数据** 的标准接口 | 带权限的业务 API |
| **插件** | 给某软件 **加能力** 的扩展（因平台而异） | 外挂模块 |

```
Skill   → 进 AI 的「脑子」（Prompt / 指令层）
MCP     → 进 AI 的「手和数据」（工具 / 资源层）
插件    → 进「宿主软件」（IDE / Knot / 浏览器等）
```

### 4.2 Skill（本项目已用）

- 位置：`knot-agent/skill-upload-packs/`、`Knot_Skill上传包_直接用/`
- 内容：`SKILL.md` 定义 Purpose、触发词、Execute 命令、Guardrails
- **注意**：Skill 只做说明与路由；实际计算必须由 Client「执行命令」跑 `knot-chat/*.sh`

### 4.3 MCP（下一阶段）

- **不是**新报表系统，而是在现有系统/文件之上，沉淀 **可被 AI 读写** 的业务上下文
- FPP 对标三类：
  - 核心系统 MCP（FPP/Payroll/主数据，若公司已有）
  - 流程 MCP（提单、审批）
  - **FPP 过程上下文 MCP**（预检报告、分摊结果、台账变更、SOP 变更）
- **长上下文**在此指 **组织记忆完整度**（同一账单月可串全链路证据），不是单纯拉长模型窗口

### 4.4 插件

- Cursor/VS Code 扩展：给人用的 IDE 能力，多数不接 FPP 业务库
- Knot Client 工具：HTTP 调 `bot-gateway`，形态类似 MCP Tool
- MCP Server 可以「以插件形式」装进 Cursor，但不是所有插件都是 MCP

---

## 5. 网页工作台 vs Knot 智能体

| 维度 | 网页工作台 | Knot 智能体 |
|------|------------|-------------|
| 交互 | 点按钮、填表单、看板 | 打字对话 |
| 是否用 LLM | 否（主流程） | 是（路由+说明） |
| 典型场景 | 上传 CSV、分摊、批量预检 | 主菜单、环节引导、演示 |
| 入口文件 | `upload-docs.html`、`chat-menu.html` | Knot chat 链接 |
| Token 消耗 | 低 | 相对较高 |

**结论**：按钮式工作台 **不是** 把 Knot 改成按钮；是 **自建 HTML + bot-gateway**，Knot 作为 **辅助入口**（如 AI 工具 Tab 里的链接）。

校招对照：

- 校招 AI 操作台 ≈ 我们的 `upload-docs` + 未来 `portal.html`
- WorkBuddy ≈ 我们的 Knot 智能体

---

## 6. 按钮接什么：不是每个按钮都嵌 Agent

| 按钮类型 | 背后接什么 | 是否 Agent |
|----------|------------|------------|
| 自动分摊 / 目录预检 / 提单文本 | `bot-gateway` → 脚本 | 否 |
| 刷新看板 / KPI | `/api/dashboard/ops` | 否 |
| 模板 / 操作手册 | 静态链接 | 否 |
| 打开 Anna / Knot | Knot 对话页 | 是 |
| iframe 嵌入 Knot（可选） | 辅助问答 | 是 |

**记忆口诀**：网页按钮主链走 **脚本/API**；Agent 是 **单独入口** 或少数「智能问答」按钮；子智能体是 **后台多角色协同**，不是 UI 上一按钮一 Bot。

---

## 7. 校招团队逻辑对照（学习参考）

### 7.1 三层

1. **网页操作台**：聚合重点事项、看板、工具入口（给人看、给人点）
2. **三类 MCP 并列**：系统事实 / 线索经营 / 过程知识（给 AI 读写）
3. **Multi-Agent（规划）**：总指挥 + 高校/猎聘/品牌/竞对 + 合成；共用同一 MCP 上下文

### 7.2 接入顺序

先跑通样板闭环：**会议纪要 → MCP 入库 → 页面/WorkBuddy 消费 → 展示**  
再扩展数据源，最后 Multi-Agent（AI 晨会等）。

### 7.3 与 FPP 映射

| 校招 | FPP |
|------|-----|
| 重点项目 / 青云计划 | 账单月 + US/CAN + 供应商 |
| 数据看板 KPI | `/api/dashboard/ops` |
| WorkBuddy | Knot + PROMPT.md |
| 校招数据 MCP | 未来 FPP 过程 MCP |
| 专科 Agent | US/CAN/预检/合规等角色（阶段 4） |

---

## 8. 本项目的文件与入口

### 8.1 目录结构（工蜂仓库）

```
amer-fpp-a/
├── web-tool/              # 网页前端
│   ├── upload-docs.html   # 完整操作台（US/CAN 分页）
│   ├── chat-menu.html     # 点击菜单式（调 API，非 LLM）
│   ├── index.html         # MVP 三按钮
│   └── README.md
├── bot-gateway/           # FastAPI 后端
│   └── main.py
├── knot-chat/             # 脚本入口
│   ├── start_web.sh
│   ├── restart_web.sh
│   └── run_agent.sh
├── knot-agent/            # Knot Prompt / Skills / 开场白
└── docker-compose.yml     # 内网部署
```

### 8.2 端口

| 服务 | 端口 | 说明 |
|------|------|------|
| 静态网页 | 18081 | `python -m http.server --directory web-tool` |
| API 后端 | 18082 | uvicorn `bot-gateway/main.py` |

### 8.3 主要 API

| 接口 | 用途 |
|------|------|
| `GET /api/health` | 健康检查 |
| `GET /api/menu` | chat-menu 菜单数据 |
| `POST /api/run` | 触发白名单 action |
| `POST /api/pain/*` | 分摊、预检、台账 |
| `GET /api/jobs` | 执行历史 |
| `GET /api/dashboard/ops` | 运营看板指标 |
| `POST /api/webhook/knotbot` | Knot Client 工具（可选） |

---

## 9. 开发与迭代方式

### 9.1 推荐节奏

**不是**一开始在服务器上写代码，而是：

```
本机 Cursor 开发 → push 工蜂 → 服务器 pull/部署 → 同事访问内网 URL
```

### 9.2 Demo 优先、再加功能

| 阶段 | 内容 |
|------|------|
| A | 门户 Tab + 布局 Demo（可先静态数据） |
| B | 按钮接 `/api/run`、`/api/pain/*` |
| C | 看板接 `/api/dashboard/ops`、jobs 历史 |
| D | MCP 入库、Knot 深链、Multi-Agent |

设计工具建议：**Figma / 即时设计** 画原型 → **Cursor 改 HTML** → 需要图表时加 **ECharts**。MVP 不必上 React 全家桶。

---

## 10. 部署：工蜂、服务器、Knot 各干什么

| 组件 | 位置 | 是否自动运行 |
|------|------|--------------|
| 源代码 | 工蜂 Git | 否，仅存储 |
| Knot 智能体 | Knot 平台 | 是（发指令即执行） |
| 网页 + bot-gateway | **内网 Linux / Docker** | 需启动 |

### 10.1 三种使用方式

**方式 A · 仅 Knot 对话**  
无需启动网页；工作区同步代码 + 配置 Prompt + Client「执行命令」。

**方式 B · 本机/工作区试用网页**  
```bash
bash knot-chat/start_web.sh
# 或
bash knot-chat/restart_web.sh
```
浏览器打开 `http://127.0.0.1:18081/upload-docs.html`（通常仅本机可访问）。

**方式 C · 团队内网正式环境（推荐）**  
```bash
git clone <工蜂仓库>
cd amer-fpp-a
docker compose up -d
```
前加 Nginx / 公司网关与 SSO，域名示例：`https://fpp-tools.xxx.woa.com`

### 10.2 服务器规格建议

| 场景 | 建议 |
|------|------|
| 小团队试点 | 内网 Linux 2 核 4G，Docker Compose |
| 正式使用 | 4 核 8G，HTTPS + 日志备份 |
| 不建议 | 工蜂 Pages 仅托管 HTML（无法跑 Python 后端） |

---

## 11. 启动与调用清单

### 11.1 维护人：启动服务

```bash
cd /path/to/amer-fpp-a
bash knot-chat/restart_web.sh
curl http://127.0.0.1:18082/api/health
```

### 11.2 操作者：网页

1. 打开内网 URL（或本机 `upload-docs.html`）
2. 配置 Backend URL（如 `http://127.0.0.1:18082`）与 Root Path（如 `/data/workspace/amer-fpp-a`）
3. 选 US/CAN → 对应分页 → 上传 CSV / 填参数 → 点执行
4. 在结果区查看 DONE 路径并下载文件

### 11.3 操作者：Knot

1. 打开 Knot chat 链接
2. 发 `主菜单` → 选 `US` 或 `CAN`
3. 按环节 1–7 或 `US演示` 操作
4. 回复须含 `DONE:` 文件路径（禁止编造）

### 11.4 调用链路

```
网页按钮 → fetch(:18082/api/...) → bot-gateway → knot-chat/*.sh → 上传输出/

Knot 对话 → Client 执行命令 → bash run_agent.sh ... → 同上
```

---

## 12. 安全与合规要点

- 只允许 **白名单 action**，禁止任意命令执行
- 文件下载限制在工作区根目录内
- 敏感列脱敏（见 `bot-gateway` 中 `SENSITIVE_COLUMNS`）
- 每次执行记录 jobs（操作人、时间、输出）
- 生产数据优先用 **只读/脱敏副本** 接 MCP；AI 提交/过账须 **人工确认**
- 内网部署，不对公网裸奔

---

## 13. 路线图建议

| 优先级 | 事项 |
|--------|------|
| P0 | 稳定 Knot + 主菜单 + 四痛点脚本 |
| P0 | 内网 Docker 部署 upload-docs |
| P1 | 新增 portal.html 门户（对标校招操作台） |
| P1 | 看板 ECharts + `/api/dashboard/ops` |
| P2 | 预检/分摊结果结构化入库（FPP MCP v0） |
| P3 | 专科 Agent 分工 + 关账前汇总 |

---

## 14. 附录：常见问题

**Q：代码 push 到工蜂后，网页为什么打不开？**  
A：工蜂不跑服务，需在服务器执行 `docker compose up` 或 `start_web.sh`。

**Q：Knot 能跑，网页按钮失败？**  
A：检查 18082 是否启动；页面 Backend URL 是否指向正确主机。

**Q：每个按钮都要做一个 Knot Bot 吗？**  
A：不需要。按钮走 API；Knot 负责对话与引导。

**Q：MCP 和 Skill 要先做哪个？**  
A：先 Skill + 脚本 + 网页闭环；MCP 在需要「跨月检索、证据链问答」时再加。

**Q：校招的子智能体我们现在要做吗？**  
A：阶段 4。当前优先 portal + 看板 + jobs/MCP 样板源。

---

## 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-06 | 首版：架构、部署、校招对照、FPP 入口 |

---

*AMER FPP + ai · SSC AI 组织建设说明 · 内部使用*
