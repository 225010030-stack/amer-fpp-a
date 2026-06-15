# Knot Chat 跑通指南（工蜂仓库 + Client 执行命令）

目标：在 Knot chat 链接里发「目录预检 / HC校验 / 总检查 / 生成提单文本块」，智能体通过 **Client→执行命令** 在工作区跑脚本并返回文件路径。

Chat 入口示例：
`https://knot.woa.com/chat?web_key=05b6ce9207b64b89ad64794a34a36368&close=0`

---

## 一、工蜂仓库里必须有哪些文件

仓库名建议：`amer-fpp-a`  
工作区目录：`/data/workspace/amer-fpp-a`

```text
amer-fpp-a/
├── docker-compose.yml          # Docker 编排（网页+后端，可选）
├── Dockerfile.backend          # 后端镜像
├── .dockerignore
├── bot-gateway/                # FastAPI 后端（webhook/网页 API）
│   ├── main.py
│   ├── requirements.txt
│   ├── config/
│   │   ├── command-map.json
│   │   └── knotbot-webhook-payload.example.json
│   └── .env.example
├── web-tool/                   # 网页前端（四按钮闭环）
│   └── upload-docs.html
├── knot-chat/                  # ★ Knot chat 专用脚本（Linux）
│   ├── run_precheck.sh
│   ├── run_hc_check.sh
│   ├── run_full_check.sh
│   ├── generate_submission_blocks.sh
│   └── start_web.sh
├── check_fpp_files.py          # 目录预检
├── check_hc_analysis.py        # HC 校验
├── generate_fpp_submission_blocks.py
├── 提单预填表模板.csv
├── HC_Analysis_统一模板.csv
├── 痛点攻坚实施包/
└── 测试文档/
```

---

## 二、关键配置文件内容

### 1) `docker-compose.yml`

```yaml
name: amer-fpp-ai

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: amer-fpp-ai-backend
    environment:
      - WORKSPACE_ROOT=/app
    volumes:
      - ./:/app
    ports:
      - "18082:18082"
    restart: unless-stopped

  web:
    image: python:3.11-slim
    container_name: amer-fpp-ai-web
    working_dir: /app
    command: python -m http.server 18081 --directory web-tool
    volumes:
      - ./:/app:ro
    ports:
      - "18081:18081"
    depends_on:
      - backend
    restart: unless-stopped
```

### 2) `Dockerfile.backend`

```dockerfile
FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 WORKSPACE_ROOT=/app
WORKDIR /app
COPY bot-gateway/requirements.txt /tmp/requirements.txt
RUN python -m pip install --upgrade pip && python -m pip install -r /tmp/requirements.txt
EXPOSE 18082
CMD ["python", "-m", "uvicorn", "main:app", "--app-dir", "bot-gateway", "--host", "0.0.0.0", "--port", "18082"]
```

### 3) `bot-gateway/requirements.txt`

```text
fastapi
uvicorn
pydantic
python-multipart
```

### 4) `bot-gateway/config/command-map.json`

```json
{
  "总检查": "run_full_check",
  "目录预检": "run_precheck",
  "hc校验": "run_hc_check",
  "hc检查": "run_hc_check",
  "生成提单文本块": "generate_submission_blocks",
  "提单文本块": "generate_submission_blocks"
}
```

### 5) `knot-chat/run_precheck.sh`（示例）

```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p "$ROOT/目录预检输出"
OUT="$ROOT/目录预检输出/预检报告_$(date +%Y%m%d_%H%M%S).md"
python3 "$ROOT/check_fpp_files.py" --root "$ROOT" --fix-report "$OUT"
echo "DONE: $OUT"
```

其他脚本见仓库 `knot-chat/` 目录。

---

## 三、把代码推到工蜂（逐步命令）

在你本机项目目录执行：

```bash
cd "/Users/zhangwenjing/Desktop/工作提效"

# 1) 看当前状态
git status

# 2) 添加工蜂远程（若还没有）
git remote add workbee https://git.woa.com/amer-fpp-a/amer-fpp-a.git
# 若已存在：git remote set-url workbee https://git.woa.com/amer-fpp-a/amer-fpp-a.git

# 3) 添加要提交的文件（不要提交运行日志/上传输出）
git add bot-gateway/ web-tool/ knot-chat/ docker-compose.yml Dockerfile.backend .dockerignore
git add check_fpp_files.py check_hc_analysis.py generate_fpp_submission_blocks.py
git add 提单预填表模板.csv HC_Analysis_统一模板.csv 痛点攻坚实施包/ 测试文档/
git add KNOT_CHAT_工蜂部署与配置.md

# 4) 提交
git commit -m "feat: add knot-chat scripts and gongfeng deploy files for Knot workspace"

# 5) 推送到工蜂
git push -u workbee main
```

认证失败时：密码处填工蜂 Token（不是登录密码）。

---

## 四、Knot 工作区绑定与同步

1. Knot → **工作区** → `amer_fpp_a`
2. **仓库管理**：
   - 仓库 URL：`https://git.woa.com/amer-fpp-a/amer-fpp-a.git`
   - 分支：`main`
   - 目录：`/data/workspace/amer-fpp-a`
   - 开启自动同步
3. **文件管理**：确认能看到 `knot-chat/`、`bot-gateway/`、`web-tool/`
4. 若为空：等 iGate 策略通过（需放行 `git.woa.com`）后重新同步

---

## 五、Knot 智能体配置（跑通 chat）

### 1) Client 工具（智能体开发页）

勾选并确认：
- **执行命令**（必须）
- **读取文件**（建议）

### 2) Prompt（复制到智能体开发页）

```text
你是 AMER FPP 流程助手，工作区路径：/data/workspace/amer-fpp-a。

当用户发送指令时，必须调用「执行命令」Client 工具，禁止只文字回答：

- 用户说「目录预检」→ bash /data/workspace/amer-fpp-a/knot-chat/run_precheck.sh
- 用户说「HC校验」→ bash /data/workspace/amer-fpp-a/knot-chat/run_hc_check.sh
- 用户说「总检查」→ bash /data/workspace/amer-fpp-a/knot-chat/run_full_check.sh
- 用户说「生成提单文本块」→ bash /data/workspace/amer-fpp-a/knot-chat/generate_submission_blocks.sh

执行后回复必须包含：
1) 成功/失败
2) DONE 后面的输出文件路径
3) 失败时给出下一步

若用户要上传 CSV 做分摊/台账四按钮闭环，引导打开网页：
http://127.0.0.1:18081/upload-docs.html
（内网部署后换正式域名）
```

### 3) 发布

点击 **发布更新**。

### 4) 在 chat 链接测试

打开你的 chat URL，依次发送：
- `目录预检`
- `HC校验`
- `总检查`

成功标志：回复里出现 `DONE: /data/workspace/amer-fpp-a/...` 文件路径。

---

## 六、工作区里可选：启动网页（A 线）

若还要在 Knot 工作区里跑网页四按钮：

```bash
cd /data/workspace/amer-fpp-a
bash knot-chat/start_web.sh
curl http://127.0.0.1:18082/api/health
```

---

## 七、验收清单

- [ ] 工蜂仓库有 `knot-chat/` 五个 sh 文件
- [ ] 工作区文件管理非空
- [ ] Client 已勾选「执行命令」
- [ ] Prompt 已发布
- [ ] chat 发「目录预检」能返回 DONE 路径
- [ ] （可选）网页 `upload-docs.html` 四按钮可跑

---

## 八、常见报错

| 报错 | 处理 |
|------|------|
| 工作区空目录 | iGate 放行 git.woa.com 后重新同步 |
| Permission denied | `chmod +x knot-chat/*.sh` 后重新 push |
| python3: not found | 工作区环境安装 Python3 或用 Docker |
| 只聊天不执行 | 检查 Client「执行命令」和 Prompt |
