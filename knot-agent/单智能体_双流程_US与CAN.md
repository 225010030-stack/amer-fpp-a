# 单智能体 · US / CAN 双流程

> **一个 Knot 智能体**，Prompt 用 `PROMPT.md`；US 与 CAN **流程分开**，靠「先锁国家」防混跑。

---

## 为什么不分两个智能体

- 同事只记 **一个** 企微机器人 / chat 链接  
- 流程上 **必须先选 US 或 CAN**，再进 0–7  
- 脚本层已有 `主菜单US` / `主菜单CAN` / `US演示` / `CAN演示`

---

## Knot 配置（只建 1 个）

| 项 | 内容 |
|----|------|
| Prompt | `knot-agent/PROMPT.md` |
| 开场白 | `WELCOME_粘贴到Knot开场白.txt` |
| Rule 建议 | 未明确 US/CAN 时禁止执行 1–7；一条指令不得同时含 US 与 CAN；输出路径须与该国 `_US_`/`_CAN_` 一致 |

---

## 同事怎么用

```
主菜单          → 先看到「选 US 还是 CAN」
US主菜单        → 美国 0–7 说明
CAN主菜单       → 加拿大 0–7 说明
US演示 / CAN演示 → 各国培训

US 2 上传输入/IN_US_P1_人数_202607.csv 202607 145411.03
CAN 2 上传输入/IN_CAN_P1_人数_202607.csv 202607 50000
```

换国家：重新发 `CAN主菜单` 或 `US主菜单`，不要沿用上一国上下文 silently。

---

## 脚本对照

| 用户发 | 脚本 |
|--------|------|
| 主菜单 | `run_sop_menu.sh`（国家选择） |
| US主菜单 | `run_sop_menu_us.sh` |
| CAN主菜单 | `run_sop_menu_can.sh` |
| US演示 | `run_demo_us.sh` |
| CAN演示 | `run_demo_can.sh` |
| 网页入口US / CAN | `run_web_guide_us.sh` / `run_web_guide_can.sh` |

---

## 参考（可选）

- `PROMPT_US.md` / `PROMPT_CAN.md`：两国规则详版，已并入 `PROMPT.md`  
- 若将来流量大可再拆两个智能体，脚本无需改

---

## 验收

| 发送 | 预期 |
|------|------|
| 主菜单 | 提示选 US主菜单 / CAN主菜单 |
| US主菜单 | 标题含「美国 US」 |
| `目录预检 202607 US` | 只报 USA 相关问题 |
| `痛点1 … US … Cigna Dental` | PROFILE 含 Cigna/Dental |
| CAN 2 … 202607 … | DONE 含 `_CAN_` |

## 国家 + 供应商（已增强）

- `bot-gateway/config/vendor_profiles.json` — 供应商/费用类型/币种/FPP 场景
- `knot-chat/lookup_vendor.py` — 按 US/CAN + Vendor 查配置
- `run_pain1_allocation.sh` — 可选第 5/6 参：Vendor、FeeType
- `run_precheck.sh 202607 US|CAN` — 按国家过滤目录预检
- `测试文档/模板/US/`、`…/CAN/` — 分国模板
- `测试文档/闭环CSV/CAN/DEMO_CAN_P2_提单预填表_202605.csv` — CAN 演示预填表
- 命名规范：`测试文档/上传命名示例/README.md`
