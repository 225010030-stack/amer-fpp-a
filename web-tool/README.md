# web-tool (MVP)

## Run

```bash
cd "/Users/zhangwenjing/Desktop/工作提效/web-tool"
python3 -m http.server 18081
```

Then open:

`http://127.0.0.1:18081/index.html`

## Note

Before opening this page, start backend first:

```bash
cd "/Users/zhangwenjing/Desktop/工作提效/bot-gateway"
python3 -m uvicorn main:app --host 0.0.0.0 --port 18082 --reload
```

## Upload mode

The page supports direct CSV upload:
- Upload 提单预填表 CSV -> Generate 提单文本块文档
- Upload HC Analysis CSV -> Generate HC 校验报告

If backend was already running before upgrade, restart backend first.
