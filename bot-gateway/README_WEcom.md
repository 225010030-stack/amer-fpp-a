# 企业微信 API 二次开发 · 部署说明

目标：同事在 **企微 chat 里发 CSV / 收 CSV**，不依赖 Knot Client 文件工具。

```text
同事企微发消息/文件
    ↓ POST /api/wecom/callback
bot-gateway（内网服务器）
    ├─ 下载附件 → 上传输入/
    ├─ bash knot-chat/run_agent.sh ...
    └─ 企微 API 回传文本 + 文件
```

---

## 一、企微管理后台配置

1. **创建自建应用**（或使用现有 FPP 应用）
2. 记录：
   - `CorpID`
   - `AgentId`
   - `Secret`（应用凭证）
3. **接收消息 → 设置 API 接收**
   - URL：`https://<你的内网域名>/api/wecom/callback`
   - Token：自定义（写入 `WECOM_CALLBACK_TOKEN`）
   - EncodingAESKey：随机生成（写入 `WECOM_ENCODING_AES_KEY`）
4. **企业可信 IP**：添加 bot-gateway 服务器出口 IP
5. **应用可见范围**：账单操作同事

> 回调 URL 必须 **HTTPS + 公网/内网可达**，企微服务器要能 POST 到你的 gateway。

---

## 二、服务器部署

### 1) 环境变量

```bash
cd /data/workspace/amer-fpp-a/bot-gateway
cp .env.example .env
# 编辑 .env，填入 WECOM_* 并设 WECOM_ENABLED=true
```

### 2) 安装依赖并启动

```bash
python3 -m pip install -r requirements.txt
export $(grep -v '^#' .env | xargs)
python3 -m uvicorn main:app --host 0.0.0.0 --port 18082
```

### 3) 健康检查

```bash
curl http://127.0.0.1:18082/api/health
curl http://127.0.0.1:18082/api/wecom/health
```

`wecom/health` 应返回 `"ok": true` 且无 `missing` 字段。

### 4) 反向代理（示例）

Nginx 将 `https://fpp-ai.internal` → `127.0.0.1:18082`，并设置：

```nginx
location /api/wecom/callback {
    proxy_pass http://127.0.0.1:18082;
}
```

---

## 三、与 Knot 智能体的关系

| 入口 | 适用 |
|------|------|
| **Knot 企微智能机器人** | 文字 SOP、执行命令（现有） |
| **本模块 `/api/wecom/callback`** | 直连企微应用 API，**聊天收/发文件** |

两者可并存：
- Knot 负责菜单引导
- 自建应用负责文件收发（或逐步替换 Knot 通道）

**注意**：若 Knot 机器人和自建应用是 **同一个 AgentId**，只能配一个回调 URL。通常应 **单独建一个「FPP 文件助手」应用** 专用于 API 回调。

---

## 四、同事怎么用

### 发文件

1. 在企微打开 **FPP 文件助手** 应用
2. 直接发送 CSV 附件
3. 收到回复：`【已收到文件】路径：上传输入/IN_WEcom_...`
4. 继续发文字指令，例如：
   - `4 上传输入/IN_WEcom_xxx.csv`
   - `2 上传输入/IN_WEcom_xxx.csv 202607 US 145411.03`

### 收文件

执行成功后，应用会：
1. 发文字摘要（含 DONE 文件名）
2. **自动推送输出 CSV/MD 文件**到 chat（最多 3 个，单文件 ≤20MB）
3. 若配置了 `WECOM_PUBLIC_BASE_URL`，文字里还带下载链接

### 文字指令（无需文件）

```
主菜单
US演示
CAN演示
目录预检 202607 US
```

---

## 五、API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/wecom/callback` | 企微 URL 验证 |
| POST | `/api/wecom/callback` | 接收消息/文件 |
| GET | `/api/wecom/health` | 配置自检 |

---

## 六、验收清单

- [ ] 企微后台 URL 验证通过（保存接收消息配置时绿勾）
- [ ] `curl /api/wecom/health` → ok
- [ ] 企微发「主菜单」→ 收到文字回复
- [ ] 企微发 CSV → 收到「已收到文件」+ 路径
- [ ] 发「US演示」→ 收到多个文件附件

---

## 七、常见问题

| 现象 | 处理 |
|------|------|
| URL 验证失败 | 检查 Token/AESKey、HTTPS、防火墙 |
| 收不到消息 | 应用可见范围、可信 IP、WECOM_ENABLED=true |
| 有文字无文件 | 文件 >20MB 或超过 `WECOM_MAX_REPLY_FILES` |
| 与 Knot 冲突 | 为文件助手单独建企微应用 |

---

## 八、代码位置

```text
bot-gateway/wecom/
├── config.py      # 环境变量
├── crypto.py      # 回调加解密
├── client.py      # 企微 API（token/media/send）
├── parser.py      # XML 消息解析
├── handler.py     # 收文件 → 跑脚本 → 回文件
└── router.py      # FastAPI 路由
```
