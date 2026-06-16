# AMER FPP + ai 1.1 发布包 · Knot 一体化接入说明

> **一个工蜂仓库** = 发布包 + Knot Agent + 网页按钮 + 自动同步  
> 工蜂：`https://git.woa.com/amer-fpp-a/amer-fpp-a.git`

---

## 一、整体架构（你要的「按钮 + 输入输出 + Agent 更新仓库」）

```text
                    ┌─────────────────────────────────────┐
                    │  工蜂 git（唯一代码源）              │
                    │  git.woa.com/amer-fpp-a/amer-fpp-a  │
                    └──────────────┬──────────────────────┘
                                   │ git pull（自动）
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
  Knot 工作区              bot-gateway:18082           knot-chat/*.sh
  /data/workspace/         网页按钮/API                 Agent 执行命令
  amer-fpp-a               输入→脚本→输出               主菜单/US演示
         │                         │
         └──────── preview ────────┘
                    │
         同事浏览器 upload-docs.html
         （上传 CSV → 下载结果）
```

| 入口 | 输入 | 输出 | 自动更新仓库 |
|------|------|------|--------------|
| **网页按钮** upload-docs | 浏览器上传 CSV | 页面下载链接 | ✅ 每次任务前 `git pull` |
| **Knot/企微 Chat** | 文字指令 | DONE 路径 + 摘要 | ✅ Agent 执行前 `sync_workspace.sh` |
| **1.1 发布包 Docker** | 同上 | 同上 | 手动 `git pull` 或挂载卷 |

---

## 二、发布包 vs 工蜂仓库（不要两套代码）

| | `AMER FPP + ai 1.1 发布包`（桌面文件夹） | 工蜂 `amer-fpp-a`（Knot 工作区） |
|--|--|--|
| 用途 | 本地/Docker 演示、docx 培训资料 | **生产运行**（Knot + 同事预览链接） |
| 含 knot-chat / wecom | ❌ 旧版 | ✅ 最新 |
| 建议 | 演示文档可继续用发布包里的 docx | **代码以工蜂为准**，发布包不再单独维护 |

**接入方式：** 不是把发布包「复制进 Knot」，而是 **发布包能力已在工蜂仓库里**，Knot 工作区 `git pull` 即用。

---

## 三、Knot 工作区一键启动（管理员）

```bash
cd /data/workspace/amer-fpp-a
git pull origin main
cp bot-gateway/.env.example bot-gateway/.env
# 编辑 .env：WORKSPACE_ROOT、PUBLIC_WEB_BASE（预览域名）、AUTO_SYNC_ON_RUN=true
bash knot-chat/start_web.sh
```

`start_web.sh` 会：
1. 加载 `bot-gateway/.env`
2. **启动前** `git pull`
3. 启动 18082（API）+ 18081（网页）

---

## 四、同事入口（不用工作区权限）

### 网页（上传/下载）

```text
https://pb0hulu9-0p-devc.preview.with.woa.com/upload-docs.html
```

页面会自动从 `/api/meta` 读取 `workspace_root`；Backend 可在 `.env` 配 `DEFAULT_API_BASE`。

### 聊天（培训/SOP）

```text
https://knot.woa.com/chat?web_key=05b6ce9207b64b89ad64794a34a36368&close=0
```

---

## 五、自动同步仓库（Agent + 网页共用）

| 机制 | 说明 |
|------|------|
| `AUTO_SYNC_ON_RUN=true` | 每次网页点按钮 / API 跑任务前自动 `git pull` |
| `bash knot-chat/sync_workspace.sh` | Agent 手动同步（Prompt 已规定） |
| `POST /api/sync` | 强制同步（运维/Agent 可调） |
| `GET /api/meta` | 查看当前 commit、上次 sync 结果 |

**你 push 到工蜂后：** 同事下次点按钮或 Agent 下次执行前会自动拉到最新代码，**无需同事操作 git**。

---

## 六、`.env` 关键项（Knot 工作区 `bot-gateway/.env`）

```bash
WORKSPACE_ROOT=/data/workspace/amer-fpp-a
AUTO_SYNC_ON_RUN=true

# 同事预览域名（你已有的）
PUBLIC_WEB_BASE=https://pb0hulu9-0p-devc.preview.with.woa.com
DEFAULT_API_BASE=https://pb0hulu9-0p-devc.preview.with.woa.com   # 若 18082 同域；否则填 18082 预览链接

WECOM_ENABLED=false   # 无企微管理员权限时保持 false
```

---

## 七、本地发布包 Docker（可选，给无 Knot 的同事试）

在 **1.1 发布包** 目录：

```bash
docker compose up -d --build
# 打开 http://127.0.0.1:18081/upload-docs.html
# Root Path: /app
```

Docker 版 **不会** 自动连工蜂；适合单机试跑。正式给 AMER 同事用 **Knot 预览链接**。

---

## 八、验收清单

- [ ] `bash knot-chat/start_web.sh` 后 health ok
- [ ] 预览链接打开 upload-docs，Health Check ok
- [ ] 点按钮生成文件，页面可下载
- [ ] 工蜂 push 新 commit 后，再点按钮 → `/api/meta` 的 `git_commit` 已更新
- [ ] Chat 发 `US演示` 有 DONE 输出

---

## 九、你日常更新流程

```text
1. 本地 Mac 改代码 → git push workbee main
2. Knot 无需手动 pull（AUTO_SYNC_ON_RUN 会在下次任务前 pull）
   或主动：bash knot-chat/sync_workspace.sh
3. 同事刷新网页 / 再发 chat 指令 → 已是新版本
```

EOF
