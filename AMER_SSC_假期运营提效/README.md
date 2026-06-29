# AMER SSC · 假期运营提效

> 与 **AMER FPP + ai** 同仓库、同运行时，独立业务域（Leave / Prepayroll）  
> 版本：v1.0 · 2026-06-16

---

## 本文件夹做什么

把 **假期运营提效** 相关的参考资料、模板、操作文档、脚本骨架集中存放，便于与 FPP 福利提单项目 **合并到同一套系统**（网页 + bot-gateway + Knot）。

```
AMER_SSC_假期运营提效/
├── README.md                          ← 你在这里
├── 01_参考资料/                        ← HRSSC 盘点原件 + 摘录
├── 02_模板/                            ← 映射表、盘点表、命名规范
├── 03_操作文档/                        ← 完整操作手册 + 多 Agent 架构
└── 04_脚本骨架/                        ← 预检 / ADP-WD 比对（待接入 bot-gateway）
```

---

## 先读哪份文档

| 角色 | 文档 |
|------|------|
| 流程负责人 / SSC 运营 | [`03_操作文档/AMER_假期运营提效_完整操作文档.md`](03_操作文档/AMER_假期运营提效_完整操作文档.md) |
| Knot 配置 / 数字化 | [`03_操作文档/多Agent统一系统_架构与落地说明.md`](03_操作文档/多Agent统一系统_架构与落地说明.md) |
| 执行 90 天计划 | [`03_操作文档/90天行动计划.md`](03_操作文档/90天行动计划.md) |
| 业务背景盘点 | [`01_参考资料/HRSSC_假期与Prepayroll_运营清单摘录.md`](01_参考资料/HRSSC_假期与Prepayroll_运营清单摘录.md) |

---

## 与 FPP 项目的关系

| 维度 | AMER FPP + ai | AMER Leave + ai（本文件夹） |
|------|---------------|----------------------------|
| 业务 | 福利账单提单、分摊、台账 | 假期报表、ADP↔WD 比对、Prepayroll 输入 |
| 网页 | `web-tool/upload-docs.html` FPP Tab | 未来同一页面的 **假期运营 Tab** |
| 后端 | `bot-gateway` `/api/pain/*` | 未来 `/api/leave/*` |
| Knot | Anna（FPP 主菜单 US/CAN） | 同一智能体 **先选域** 或 专科 Agent |
| 脚本 | `knot-chat/run_pain*.sh` | `knot-chat/run_leave*.sh`（待建） |

**结论**：两个业务 **共用一个运行时**（端口、部署、jobs 审计），**不共用一个计算脚本**。

---

## 快速启动（脚本骨架本地试跑）

```bash
cd "/Users/zhangwenjing/Desktop/工作提效"

# 目录与命名预检（假期输入文件）
python3 AMER_SSC_假期运营提效/04_脚本骨架/check_leave_files.py \
  --root . \
  --country US \
  --period 202606

# ADP vs WD 比对（需准备映射表 + 两份导出 CSV）
python3 AMER_SSC_假期运营提效/04_脚本骨架/run_leave_reconcile.py \
  --root . \
  --country US \
  --period 202606 \
  --adp 上传输入/IN_US_L1_ADP_TimeOff_202606.csv \
  --wd 上传输入/IN_US_L1_WD_Absence_202606.csv
```

正式接入 bot-gateway 后，同事通过网页按钮触发，无需记命令。

---

## 关联仓库路径（FPP 已有）

- 网页操作台：`web-tool/upload-docs.html`
- 后端网关：`bot-gateway/main.py`
- Knot Prompt：`knot-agent/PROMPT.md`
- 组织建设说明：`docs/AMER_FPP_AI工作台与组织建设说明.md`
