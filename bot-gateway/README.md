# bot-gateway (MVP)

## Start

```bash
cd "/Users/zhangwenjing/Desktop/工作提效/bot-gateway"
python3 -m pip install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 18080 --reload
```

## APIs

- `GET /api/health`
- `POST /api/run`
- `POST /api/webhook/knotbot`
- `POST /api/upload-and-generate`
- `GET /api/jobs/latest`
- `GET /api/files?path=<absolute-path>`

## Example run request

```json
{
  "action": "run_full_check",
  "root": "/Users/zhangwenjing/Desktop/工作提效"
}
```

Supported `action` values:
- `run_precheck`
- `run_hc_check`
- `run_full_check`
- `generate_submission_blocks`

Upload endpoint (`/api/upload-and-generate`) supports:
- `action=generate_submission_blocks` (upload CSV -> output 提单文本块 markdown)
- `action=hc_check_upload` (upload HC CSV -> output HC 校验报告 markdown)

## Webhook mode (for robot callback)

Request:

```json
{
  "text": "总检查"
}
```

If `BOT_GATEWAY_TOKEN` is set, pass header:

`X-Bot-Token: <your-token>`
