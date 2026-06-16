# AMER FPP · US / CAN 双智能体部署（可选）

> **默认方案：单智能体双流程**，见 [单智能体_双流程_US与CAN.md](./单智能体_双流程_US与CAN.md) + `PROMPT.md`。  
> 下文为「拆成两个 Knot 智能体」的备选，仅在需要完全隔离链接时使用。

---

## 对照表

| 项目 | 美国 US | 加拿大 CAN |
|------|---------|------------|
| Knot 智能体名称 | `AMER FPP · US` | `AMER FPP · CAN` |
| Prompt 文件 | `knot-agent/PROMPT_US.md` | `knot-agent/PROMPT_CAN.md` |
| 开场白 | `WELCOME_US_粘贴到Knot开场白.txt` | `WELCOME_CAN_粘贴到Knot开场白.txt` |
| 主菜单脚本 | `run_agent.sh 主菜单US` | `run_agent.sh 主菜单CAN` |
| 培训演示 | `0` / `US演示` | `0` / `CAN演示` |
| 网页入口 | `网页入口US` → upload-docs **US 区** | `网页入口CAN` → upload-docs **CAN 区** |
| 分摊国家参数 | 固定 `US` | 固定 `CAN` |
| 输出文件名 | `*_US_*` | `*_CAN_*` |

工作区可共用：`/data/workspace/amer-fpp-a`（同一 git 仓库）。

---

## Knot 配置步骤（各做一遍）

1. **智能体开发** → 新建或复制智能体
2. **Prompt**：全选复制 `PROMPT_US.md` 或 `PROMPT_CAN.md`
3. **开场白**：复制对应 `WELCOME_*`
4. **Rules**（建议各加一条）：
   - US：`本智能体仅处理 US。任何 CAN/加拿大请求必须拒绝并提示换 CAN 智能体。分摊命令第三参数必须是 US。`
   - CAN：`本智能体仅处理 CAN。任何 US/美国请求必须拒绝并提示换 US 智能体。分摊命令第三参数必须是 CAN。`
5. **Client 工具**：执行命令、读取文件
6. **工作区**：amer-fpp-a
7. **发布更新**

---

## 同事怎么选

- 做 **美国** 账单 → 企微/US 智能体链接
- 做 **加拿大** 账单 → CAN 智能体链接
- **不要**两个国家共用一个 chat 链接

---

## 验收

| 智能体 | 发送 | 预期 |
|--------|------|------|
| US | 主菜单 | 标题含「美国 US 专用」 |
| US | US演示 | DONE 含 `_US_` |
| US | 「帮我做 CAN」 | 拒绝，提示 CAN 智能体 |
| CAN | 主菜单 | 标题含「加拿大 CAN 专用」 |
| CAN | CAN演示 | DONE 含 `_CAN_` |

---

## 旧版合并 Prompt

`PROMPT.md` 为合并版，**不再推荐**用于生产；请改用 `PROMPT_US.md` / `PROMPT_CAN.md`。
