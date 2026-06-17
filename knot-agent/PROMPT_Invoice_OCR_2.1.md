# Knot 识图智能体 · Invoice OCR（2.1 专用，与 Anna 分离）

> **用途**：仅被 `upload-docs` 步骤 4 通过 `bot-gateway` 转发调用；**不接 Chat 主菜单**。  
> 在 Knot 新建第二个智能体，例如 **`AMER FPP · Invoice OCR`**。

---

## 1. 智能体配置

| 项 | 建议 |
|----|------|
| 名称 | `AMER FPP · Invoice OCR` |
| 模型 | 选 **支持识图/多模态** 的模型（Knot 控制台里带 Vision 的型号） |
| Client 工具 | **HTTP 服务** 或 **执行命令** 二选一（见下） |
| 工作区 | 同 `amer-fpp-a`（可选，识图可不跑 shell） |

---

## 2. Prompt（粘贴到智能体）

```text
你是 Invoice 字段抽取器，不做闲聊。

输入：JSON，含 image_base64、mime、filename、profile_id、prompt、fields_requested。
（gateway 上传 PDF 时会自动转成 PNG 再转发，无需手工换格式。）

任务：从 PDF/图片中抽取 invoice 字段，每个字段给 value + confidence(0~1)。

必须只输出 JSON（不要 markdown 包裹）：
{
  "fields": {
    "vendor": {"value": "Cigna", "confidence": 0.92},
    "amount": {"value": "145411.03", "confidence": 0.88},
    "currency": {"value": "USD", "confidence": 0.95},
    "period": {"value": "202607", "confidence": 0.7},
    "invoice_no": {"value": "INV-123", "confidence": 0.65}
  }
}

规则：
- 看不清的字段 confidence < 0.5，value 可留空
- 不要编造；金额只取发票总额/Amount Due
- period 优先 YYYYMM
```

---

## 3. 与 bot-gateway 对接（推荐架构）

```text
同事浏览器 → upload-docs 步骤4
    → POST /api/invoice-extract/run (mode=knot_agent)
        → POST {KNOT_VISION_WEBHOOK_URL}  （你配的第二个 Agent 的 HTTP 入口）
            ← JSON { fields: {...} }
    ← 网页展示置信度 + 报告
```

### 网页里配置（管理员）

`upload-docs` → 步骤 **4 账单核对** → 展开 **Knot 识图智能体配置**：

- 勾选「启用 Knot 识图」
- **Webhook URL**：第二个 Agent 的 Client HTTP 地址
- 识图模式选 **`knot_agent`**

配置文件：`bot-gateway/config/invoice_extract_settings.json`（与网页保存同步）

---

## 4. 若 Knot 只能「Client → 执行命令」

可让第二个 Agent 只做识图，由工作区脚本收 JSON：

```bash
python3 /data/workspace/amer-fpp-a/bot-gateway/invoice_vision_stub.py
```

（当前 2.1 MVP 优先 **HTTP 直调**；无 HTTP 时网页先用 **local** 模式测 PDF 文本抽取。）

---

## 5. 验收

1. 网页 mode=**local**，上传含文字的 PDF → 有 amount/vendor + 置信度  
2. 配置 knot webhook 后 mode=**knot_agent**，上传 **PDF 或** 扫描件 PNG → gateway 自动 PDF→PNG → 字段来自 Agent  
3. 低置信度仍显示 ⚠，**不锁定** 后续分摊/提单  

---

## 6. 与主 Agent（Anna）关系

| | Anna 主 Agent | Invoice OCR Agent |
|--|---------------|-------------------|
| 入口 | Chat（可选，2.1 不接） | 仅网页 gateway 转发 |
| 能力 | 菜单、脚本、DONE 路径 | 识图 JSON |
| 配置 | PROMPT.md | 本文件 |

**可以也建议加第二个智能体**——主 Agent 不必承载 Vision，避免 Prompt 过长、误触发识图。
