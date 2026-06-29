# 多 Agent 统一系统 · 架构与落地说明

> FPP + 假期运营 **同一运行时**，对标校招「操作台 + MCP + Multi-Agent」  
> 版本：v1.0 · 2026-06-16

---

## 1. 你的问题：现实吗？

**现实。** 而且你们已经有一半基础设施：

| 校招 AI Native | 你们已有 | 假期域待建 |
|----------------|----------|------------|
| 校招 AI 操作台 | `upload-docs.html` | 加「假期运营」Tab |
| WorkBuddy | Knot Anna + PROMPT | 加假期路由 / 专科 Prompt |
| 校招数据 MCP | jobs.json + 文件落盘 | Leave 过程 MCP |
| Multi-Agent 圆桌 | 文档阶段 4 规划 | FPP Agent + Leave Agent + 合成 |

**关键认知（与校招 PDF 一致）**：

- **网页按钮 ≠ Agent** — 分摊、比对仍走脚本  
- **Agent = 路由、说明、跨域综合问答、晨会式汇总**  
- **Multi-Agent = 共用同一 MCP 上下文，分角色分析，不是 UI 上一按钮一 Bot**

---

## 2. 推荐架构（三阶段）

### 阶段 A · 现在就能做（单运行时 + 单智能体分域）

**一个 bot-gateway、一个网页、一个 Knot 智能体**，Prompt 里 **先选业务域**：

```
主菜单
  ├─ FPP主菜单（现有 US/CAN）
  └─ 假期主菜单（新增 US/CAN）
```

| 优点 | 缺点 |
|------|------|
| 同事只记一个 chat 链接 | Prompt 变长，需严格 guardrail |
| 部署一次 | 两域规则要分章节写清 |
| 与现有 `单智能体_双流程_US与CAN.md` 一致 | — |

**实现清单**：

1. `run_agent.sh` 增加 `假期*` 指令  
2. `bot-gateway` 增加 `/api/leave/*`  
3. `upload-docs.html` 增加 Tab  
4. `knot-agent/PROMPT.md` 增加「假期域」章节（或 `PROMPT_LEAVE.md` 片段并入）

### 阶段 B · 3–6 个月（专科 Agent，校招式）

**仍是一个操作台 + 一套 MCP**，Knot 上 **2–3 个智能体**：

| Agent | 职责 | 挂载 Skill |
|-------|------|------------|
| **Anna-FPP** | US/CAN 分摊、提单、台账 | skill-pain1–4 |
| **Anna-Leave** | ADP/WD 比对、Prepayroll 假期包 | skill-leave-* |
| **Anna-SSC**（可选合成） | 月结前汇总：FPP 阻断 + Leave 阻断 | 只读 MCP 报告 |

同事入口可以：

- **方案 1**：两个 chat 链接（FPP 群 / Leave 群）— 最清晰  
- **方案 2**：一个「SSC 总入口」Bot，第一句话选域 — 与校招 WorkBuddy 总入口类似

### 阶段 C · 6–12 个月（Multi-Agent 协同，校招晨会式）

对标校招「周一 AI 晨会」：

```
总指挥 Agent：「本账单月 FPP 与 Prepayroll 整体风险？」
  → FPP Agent：3 家供应商分摊阻断
  → Leave Agent：US bi-weekly 12 条 ADP/WD 差异
  → 合成 Agent：「建议周一先清 Leave 阻断再跑 P3 成本中心」
```

**前提**：Leave + FPP **过程 MCP** 已入库（报告、映射表版本、处理记录）。

---

## 3. 系统运行时一张图

```
┌──────────────────────────────────────────────────────────────────┐
│  SSC AI 操作台（一个 URL）                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │ Tab: FPP    │  │ Tab: 假期   │  │ Tab: 看板   │               │
│  │ US / CAN    │  │ US / CAN    │  │ KPI/jobs    │               │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘               │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          └────────────────┼────────────────┘
                           │ HTTP :18082
┌──────────────────────────▼──────────────────────────────────────┐
│  bot-gateway（一个进程）                                          │
│  /api/pain/*          FPP 脚本                                    │
│  /api/leave/*         假期脚本                                    │
│  /api/dashboard/*     统一看板                                    │
│  jobs.json            domain=fpp|leave                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  knot-chat/*.sh  +  AMER_SSC_假期运营提效/04_脚本骨架/*.py          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  数据层：上传输入/ 上传输出/ 映射表/ jobs / 未来 SSC 过程 MCP       │
└───────────────────────────────────────────────────────────────────┘

          ┌──────────────── Knot 层 ────────────────┐
          │  Anna-FPP  │  Anna-Leave  │  合成(可选) │
          │  Skills    │  Skills      │  读 MCP     │
          └─────────────────────────────────────────┘
```

---

## 4. 与校招三类 MCP 的对标

| 校招 MCP | SSC 对标 | 内容 |
|----------|----------|------|
| 人平校招数据 MCP | 核心系统 MCP | FPP/Payroll/WD/ADP 只读事实（若公司开放） |
| 招聘 CRM MCP | 流程 MCP | 提单状态、Prepayroll checklist |
| 校招数据 MCP | **SSC 过程 MCP** | 比对报告、映射表版本、异常处理记录、SOP 变更 |

**样板闭环（照抄校招顺序）**：

1. bi-weekly 比对报告 → 入库 MCP  
2. 操作台看板展示阻断数  
3. Knot 问「本期 Leave 阻断怎么处理」→ 引 MCP 历史 case  
4. 再扩展 FPP 报告进同一 MCP → 合成 Agent 跨域汇总  

---

## 5. Prompt / Skill 分工建议

### 5.1 单智能体 Prompt 结构（阶段 A）

```markdown
## 域选择（必须先选）
- FPP → US主菜单 / CAN主菜单
- 假期 → 假期主菜单US / 假期主菜单CAN

## FPP 规则（现有 PROMPT.md）
...

## 假期规则
- 禁止 LLM 计算 days/hours/balance
- 只执行 run_agent.sh 假期* 指令
- 输出以 DONE: 为准
...
```

### 5.2 Skill 列表（阶段 B）

| Skill | 触发词 | Execute |
|-------|--------|---------|
| skill-leave-reconcile | ADP WD 比对、假期比对 | `run_agent.sh 假期比对` |
| skill-leave-precheck | 假期目录预检 | `run_agent.sh 假期预检` |
| skill-leave-demo-us | US假期演示 | `run_agent.sh US假期演示` |

FPP 现有 skill-pain1–4 **保持不变**。

---

## 6. 网页 Tab 设计（阶段 A）

在 `upload-docs.html` 左侧 Pill 增加：

| Tab | 按钮示例 |
|-----|----------|
| 假期运营 · US | ADP/WD 比对 · Prepayroll 预检 · 下载映射表 |
| 假期运营 · CAN | 同上 |

与 FPP Tab **共享**：Backend URL、健康检查、jobs 历史、语言切换。

---

## 7. 权限与安全

| 数据 | 策略 |
|------|------|
| 员工 ID / 假期记录 | 脱敏列配置进 bot-gateway |
| 映射表变更 | Benefits COE 维护，版本号写入 MCP |
| 导入 Prepayroll | **人工确认** gate，脚本只产出候选包 |
| API | 白名单 action，禁止任意 shell |

---

## 8. 落地顺序（建议）

| 周 | 交付 |
|----|------|
| 1–2 | 本文件夹脚本 PoC + 盘点表 |
| 3–4 | bot-gateway `/api/leave/reconcile` + 网页 Tab |
| 5–6 | `run_agent.sh` 假期指令 + Skill 上传 |
| 7–8 | jobs 看板 + 映射表版本治理 |
| 9–12 | 过程 MCP 样板 + 考虑拆 Anna-Leave 专科 Agent |
| 12+ | Multi-Agent 晨会（可选） |

---

## 9. 决策表：该用几种 Agent？

| 情况 | 建议 |
|------|------|
| 团队 < 10 人，你兼维护 | **1 个 Agent + 域路由** |
| FPP 与 Leave 不同群组操作 | **2 个 Agent**，同一 backend |
| 要做跨域月结晨会 | **+1 合成 Agent**，只读 MCP |
| 按钮式月结为主 | **网页为主，Agent 为辅**（与校招一致） |

---

## 10. 结论

把 FPP 与假期运营做到 **一个系统运行时** 不仅现实，而且与校招 AI Native **同一路径**：

1. **先** 操作台聚合 + 脚本 Pipeline  
2. **再** 过程 MCP 沉淀  
3. **最后** Multi-Agent 分工与合成  

不要跳过 1 直接做 3。你们 FPP 已在阶段 1–2，假期域复制同一模式即可。

---

*详见 [`AMER_假期运营提效_完整操作文档.md`](AMER_假期运营提效_完整操作文档.md)*
