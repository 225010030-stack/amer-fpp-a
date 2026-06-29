# AMER · 假期运营提效 · 完整操作文档

> 适用：SSC 假期/Prepayroll 运营、Benefits COE、数字化维护人  
> 版本：v1.0 · 2026-06-16  
> 关联：`AMER_SSC_假期运营提效/` · 与 `AMER FPP + ai` **同一系统运行时**

---

## 目录

1. [目标与范围](#1-目标与范围)
2. [业务全景（As-Is）](#2-业务全景as-is)
3. [自动化等级定义 L0–L4](#3-自动化等级定义-l0l4)
4. [核心链路：ADP ↔ WD ↔ Prepayroll](#4-核心链路adp--wd--prepayroll)
5. [标准 SOP（操作者）](#5-标准-sop操作者)
6. [文件与命名](#6-文件与命名)
7. [脚本与 API（维护人）](#7-脚本与-api维护人)
8. [校验规则与阻断分级](#8-校验规则与阻断分级)
9. [与 FPP 合并到同一系统](#9-与-fpp-合并到同一系统)
10. [KPI 与验收](#10-kpi-与验收)
11. [FAQ](#11-faq)

---

## 1. 目标与范围

### 1.1 OKR 对应

| OKR 条目 | 本方案落地 |
|----------|------------|
| 盘点假期报表在 SSC 的自动化程度 | [`02_模板/假期报表自动化盘点表_L0-L4.csv`](../02_模板/假期报表自动化盘点表_L0-L4.csv) |
| 推动假期报表全面支持 SSC Prepayroll | L3 标准输出 `Prepayroll_LeaveInput_*.csv` |
| 按需建设 AI 自动化计算 | **脚本算数 + AI 只做抽取/说明**（禁止 LLM 算天数） |
| ADP timecard & WD Absence 比对自动化 | `run_leave_reconcile.py` + 网页按钮 |

### 1.2 优先级

1. **P0**：US / CA — bi-weekly ADP↔WD 比对 + Prepayroll 假期输入包  
2. **P1**：SG / NZ / NL — 余额与入离调转、终止结算  
3. **P2**：特殊假期材料（#6）、政府补贴（#7）、APAC 调休

### 1.3 不在首期范围

- 直接写回 ADP / Workday 生产系统（须人工确认后导入）  
- 替代 Payroll 正式过账审批  
- 无映射表时的「猜测匹配」

---

## 2. 业务全景（As-Is）

来源：[`01_参考资料/HRSSC_假期与Prepayroll_运营清单摘录.md`](../01_参考资料/HRSSC_假期与Prepayroll_运营清单摘录.md)

### 2.1 Prepayroll 相关（并薪运营）

| # | 工作项 | 关键点 |
|---|--------|--------|
| 3 | 统计并薪结算假期、实习生/兼职工时 | 离职余额、无薪/半薪、LOA；优化方向 **Benefits 大宽表自动化** |
| 4 | 考勤卡 + **WD vs ADP 休假日期/余额/交易比对** | US/CA **bi-weekly 人工比对** — Top 痛点 |
| 10 | Meal allowance / 考勤 Prepayroll | 与 Benefits 模块交叉 |

### 2.2 Benefits 假期相关

| # | 工作项 | 关键点 |
|---|--------|--------|
| 6 | 特殊假期材料审核与核算 | STD/FMLA：WD 审批 → ADP 再提交 → Prepayroll 算 unpaid / 40% |
| 7 | 法定/特殊假期政府补贴 | 销假后 SSC 算多退少补 |
| 9 | 加班调休假录入 | APAC 为主 |

### 2.3 六段主链路（To-Be 目标）

```
上游导出 → 映射治理 → 双源比对 → 分级报告 → Prepayroll 输入包 → 人工确认 → 系统导入 → jobs 归档
```

---

## 3. 自动化等级定义 L0–L4

| 等级 | 名称 | 特征 | 示例 |
|------|------|------|------|
| L0 | 纯手工 | Excel 复制粘贴 | JP 调休人工算 |
| L1 | 系统导出+人工整理 | 有导出，无标准 | 当前 US/CA bi-weekly 比对 |
| L2 | 脚本合并/计算 | Python 可复现 | 合并 ADP+WD 为宽表 |
| L3 | 阻断校验+标准输出 | 阻断/提示分级 + 标准 CSV | **首期目标** |
| L4 | 周期自动跑+看板 | cron + dashboard + MCP | 阶段 3 |

**盘点动作**：每月更新 [`假期报表自动化盘点表_L0-L4.csv`](../02_模板/假期报表自动化盘点表_L0-L4.csv)，在 Pre-Payroll Quality Improvement Log 例会过一遍。

---

## 4. 核心链路：ADP ↔ WD ↔ Prepayroll

### 4.1 比对维度

| 维度 | ADP | WD | 规则 |
|------|-----|-----|------|
| 休假日期 | Time Off transactions | Absence approved dates | 日期精确匹配（可配置 ±1 天） |
| 余额 | Time off balance | Absence balance | 数值差 ≤ 阈值 |
| Timecard | Hours by pay period | — | non-exempt bi-weekly |
| 审批状态 | Supervisor approval | WD task status | 映射表 |
| 员工键 | associate_id | employee_id | **员工ID映射表** |

### 4.2 数据流

```
IN_*_L1_ADP_*.csv  ──┐
                     ├──► run_leave_reconcile.py ──► Leave_Reconcile_*.md（摘要）
IN_*_L1_WD_*.csv   ──┤                              Leave_Diff_Detail_*.csv
                     │                              Leave_Blockers_*.md（阻断）
映射表 L2 ───────────┘                              Prepayroll_LeaveInput_*.csv（通过项）
```

### 4.3 Prepayroll 输入包必含字段（v1）

| 字段 | 说明 |
|------|------|
| employee_id | WD 主键 |
| adp_associate_id | ADP 主键 |
| pay_period | YYYYMM 或 bi-weekly 区间 |
| leave_type_code | 来自假期类型映射表 prepayroll_code |
| days / hours | 结算量 |
| pay_ratio | 0 / 0.4 / 1 等 |
| wd_approved | YES/NO |
| adp_matched | YES/NO |
| blocker_flag | 空=可导入；非空=阻断 |
| notes | 人工备注 |

---

## 5. 标准 SOP（操作者）

> 与 FPP 月结 SOP 相同节奏：**先环境 → 再上传 → 再执行 → 再看 DONE**

### 5.1 首次打开（与 FPP 共用网页）

1. 打开 `upload-docs.html`（内网 URL 或本机 `http://127.0.0.1:18081/upload-docs.html`）  
2. 健康检查 → `"ok": true`  
3. 左侧选 **🇺🇸 US** 或 **🇨🇦 CAN**（整批只在一个国家）  
4. 切换到 **「假期运营」Tab**（接入后；当前可用命令行试跑）

### 5.2 bi-weekly 比对 SOP（US/CA）

| 步骤 | 动作 | 交付 |
|------|------|------|
| A1 | 从 ADP 导出 Time Off / Timecard（按 SOP 字段） | `IN_*_L1_ADP_TimeOff_YYYYMM.csv` |
| A2 | 从 WD 导出 Absence（同期） | `IN_*_L1_WD_Absence_YYYYMM.csv` |
| A3 | 确认 Benefits 维护的映射表为当月版本 | `02_模板/员工ID映射表_*.csv` |
| B1 | 上传两份 L1 + 映射表 → 点 **「ADP/WD 假期比对」** | — |
| B2 | 打开 `Leave_Reconcile_*.md` 看摘要 | 阻断数 / 提示数 / 通过数 |
| B3 | 打开 `Leave_Blockers_*.md` **先处理阻断** | 处理完重跑 |
| C1 | 阻断清零后下载 `Prepayroll_LeaveInput_*.csv` | 交 Prepayroll 接口人 |
| C2 | 人工复核签字 → 导入 Payroll 系统 | 系统回执存档 |

### 5.3 特殊假期（#6）SOP 要点

1. WD task 审批完成  
2. 美国在 ADP 再次提交/审批（特殊福利）  
3. Prepayroll 录入：unpaid days、比例付薪（如 40%）  
4. **AI 辅助**：从材料 PDF/邮件抽取字段到预填表 — **人工确认后再进 L3 包**

### 5.4 Knot Chat SOP（培训/问流程）

```
主菜单              → 选 FPP 或 假期
假期主菜单          → 看 L1–L3 说明
US假期演示          → 内置 DEMO 跑通
US 假期比对 …       → 正式比对（路径+期间）
网页入口假期US      → 引导打开网页 Tab
```

---

## 6. 文件与命名

详见 [`02_模板/命名规范_假期运营.md`](../02_模板/命名规范_假期运营.md)

**记忆口诀**：FPP 用 `P1–P4`，假期用 `L1–L3`；输出在 `上传输出/`，必须带 `_US_` 或 `_CAN_`。

---

## 7. 脚本与 API（维护人）

### 7.1 当前骨架（本文件夹）

```bash
# 预检
python3 AMER_SSC_假期运营提效/04_脚本骨架/check_leave_files.py \
  --root . --country US --period 202606

# 比对
python3 AMER_SSC_假期运营提效/04_脚本骨架/run_leave_reconcile.py \
  --root . --country US --period 202606 \
  --adp 上传输入/IN_US_L1_ADP_TimeOff_202606.csv \
  --wd 上传输入/IN_US_L1_WD_Absence_202606.csv \
  --id-map AMER_SSC_假期运营提效/02_模板/员工ID映射表_ADP_WD.csv \
  --type-map AMER_SSC_假期运营提效/02_模板/假期类型映射表.csv
```

成功标志：stdout 含 `DONE: .../上传输出/Leave_Reconcile_US_202606.md`

### 7.2 接入 bot-gateway（计划）

| API | 用途 |
|-----|------|
| `POST /api/leave/reconcile` | ADP+WD 比对 |
| `POST /api/leave/prepayroll-pack` | 仅生成 Prepayroll 包 |
| `POST /api/leave/precheck` | 目录与命名校验 |
| `GET /api/dashboard/leave` | 看板：阻断 Top、一次通过率 |

### 7.3 knot-chat 路由（计划）

在 `run_agent.sh` 增加：

- `假期主菜单` / `假期主菜单US` / `假期主菜单CAN`  
- `假期比对` / `leave_reconcile`  
- `US假期演示`

---

## 8. 校验规则与阻断分级

| 级别 | 含义 | 处理 |
|------|------|------|
| **阻断** | 不可进 Prepayroll 包 | 必须修正或升级 Benefits |
| **提示** | 可进包但须 notes | 操作者确认后导入 |
| **通过** | 双源一致 | 自动进包 |

### 阻断规则（v1）

1. 员工 ID 映射缺失  
2. WD 已批准但 ADP 无对应记录（或反向）  
3. 余额差异 > 配置阈值  
4. 假期类型无法映射到 prepayroll_code  
5. 未审批记录出现在 Prepayroll 候选集  
6. 终止员工仍有 open balance 未结算  

---

## 9. 与 FPP 合并到同一系统

### 9.1 共用什么

| 组件 | 说明 |
|------|------|
| `web-tool/upload-docs.html` | 左侧工作区 + Tab：FPP / 假期运营 |
| `bot-gateway` | 同一端口 18082，不同 API 前缀 |
| `上传输入/` `上传输出/` | 同一目录，P* 与 L* 前缀区分 |
| `jobs.json` | 同一审计日志，action 字段区分 domain |
| Docker / `start_web.sh` | 一次启动，两个业务域 |

### 9.2 不共用

- 计算脚本（`run_pain*` vs `run_leave*`）  
- 字段字典（供应商字典 vs 假期类型映射）  
- Knot Skill 包（分开上传，可同一智能体挂载）

### 9.3 多 Agent 怎么放

见 [`多Agent统一系统_架构与落地说明.md`](多Agent统一系统_架构与落地说明.md)

**结论**：**现实且推荐** — 与校招一样「一个操作台 + 一套 MCP + 多个专科 Agent」，但 **阶段 1 先用单智能体分域路由**（成本最低）。

---

## 10. KPI 与验收

| 指标 | 基线 | 90 天目标 |
|------|------|-----------|
| US/CA bi-weekly 比对人工时长 | 4–8h | ↓ 50%+ |
| Prepayroll 假期输入一次通过率 | 待量 | ≥ 90% |
| 阻断项在导入前被发现比例 | 低 | ≥ 95% |
| 映射表月度版本可追溯 | 无 | 100% |
| 每次执行 jobs 留痕 | 无 | 100% |

---

## 11. FAQ

**Q：能和 FPP 月结同一天跑吗？**  
A：可以。同一网页、同一后端，但 **US/CAN 国家锁一致**，FPP 与 Leave 文件不要混前缀。

**Q：AI 会不会算错天数？**  
A：天数、余额、比例 **只信 Python 脚本**；AI 只读报告摘要、引 SOP。

**Q：没有 ADP API 怎么办？**  
A：首期 **CSV 导出版** 即可；与 FPP 一样先文件闭环，再接 API。

**Q：Benefits 治理要做什么？**  
A：维护并版本化 [`员工ID映射表`](../02_模板/员工ID映射表_ADP_WD.csv)、[`假期类型映射表`](../02_模板/假期类型映射表.csv)；变更写 changelog。

---

*AMER SSC · 假期运营提效 · 内部使用*
