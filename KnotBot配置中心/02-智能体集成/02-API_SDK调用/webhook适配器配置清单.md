# 机器人 webhook 适配器配置清单

> 目标：把 KnotBot 回调直接转成 `bot-gateway` 的 `/api/run` 执行。  
> 结果：同事在机器人输入指令即可跑脚本并得到文件结果。

---

## A. 你需要配置的文件（在项目里）

- `bot-gateway/main.py`
  - webhook 入口：`POST /api/webhook/knotbot`
  - 指令解析：从回调 payload 里读取 `text/content/query/message`
  - 指令映射：通过 `config/command-map.json`
  - 鉴权：读取环境变量 `BOT_GATEWAY_TOKEN`

- `bot-gateway/config/command-map.json`
  - 作用：关键词 -> action 映射
  - 当前默认：
    - `总检查` -> `run_full_check`
    - `目录预检` -> `run_precheck`
    - `hc校验` / `hc检查` -> `run_hc_check`
    - `生成提单文本块` / `提单文本块` -> `generate_submission_blocks`

- `bot-gateway/.env.example`
  - 参数：`BOT_GATEWAY_TOKEN`
  - 作用：机器人调用时的 header token 校验（可选但建议开启）

- `bot-gateway/config/knotbot-webhook-payload.example.json`
  - 作用：给联调时做请求体样例

---

## B. KnotBot 控制台需要填的参数（逐项）

在机器人“Client 工具 / 回调配置”里填：

- 回调 URL  
  - `http://<你的网关地址>:18080/api/webhook/knotbot`

- 请求方法  
  - `POST`

- 请求头（建议）
  - `Content-Type: application/json`
  - `X-Bot-Token: <与你环境变量一致的token>`

- 请求体（最小）
  - `{"text":"{{user_input}}"}`

说明：
- `{{user_input}}` 表示机器人收到的原始用户消息
- 如果平台字段名不是这个，改成你平台的消息变量即可

---

## C. 后端 action 参数（无需在机器人填）

机器人只需要传文字指令。  
真正执行参数由网关内部映射，不暴露给同事。

内部 action 列表：
- `run_precheck`
- `run_hc_check`
- `run_full_check`
- `generate_submission_blocks`

---

## D. 返回格式（机器人可直接展示）

成功时返回：
- `ok`
- `action`
- `message`
- `data`
  - `run_id`
  - `elapsed_ms`
  - `log_file`
  - `outputs`（关键：结果文件路径列表）

失败时返回：
- `ok=false`
- `message`（例如：未识别指令 / token错误）

---

## E. 你可以直接跑的联调命令

## 1) 启动网关

```bash
cd "/Users/zhangwenjing/Desktop/工作提效/bot-gateway"
python3 -m pip install -r requirements.txt
BOT_GATEWAY_TOKEN=your-token python3 -m uvicorn main:app --host 0.0.0.0 --port 18080 --reload
```

## 2) 本地模拟机器人回调

```bash
curl -X POST "http://127.0.0.1:18080/api/webhook/knotbot" \
  -H "Content-Type: application/json" \
  -H "X-Bot-Token: your-token" \
  -d '{"text":"总检查"}'
```

---

## F. 同事可用指令（建议固定）

- `总检查`
- `目录预检`
- `HC校验`
- `生成提单文本块`

只保留这 4 条最稳，不建议前期放太多指令。
