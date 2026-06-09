# AMER FPP + ai｜Docker封装本地试跑说明

## 你现在得到的内容

- `Dockerfile.backend`：后端镜像定义
- `docker-compose.yml`：前后端一起启动
- `.dockerignore`：减少构建上下文

---

## 1) 前置条件

- 本机已安装 Docker Desktop
- Docker Desktop 正在运行

---

## 2) 一键试跑

在项目根目录执行：

```bash
docker compose up -d --build
```

启动后访问：

- 前端：`http://127.0.0.1:18081/upload-docs.html`
- 后端健康检查：`http://127.0.0.1:18082/api/health`

---

## 3) 停止与清理

```bash
docker compose down
```

如果你要删除镜像和未使用网络：

```bash
docker compose down --rmi local
```

---

## 4) 当前方案说明

- 属于“本地Docker试跑版”
- 前端容器仅提供静态页面
- 后端容器执行你现有脚本，读写目录仍在项目根（通过卷挂载）

---

## 5) 常见问题

### Q1: 网页能开但按钮报错
- 检查后端是否正常：`http://127.0.0.1:18082/api/health`
- 检查前端`Backend URL`是否为`http://127.0.0.1:18082`

### Q2: 端口冲突
- 你本机如果已有18081/18082进程，先停掉再起docker

### Q3: 同事打不开
- 这是本机地址（127.0.0.1），只能本机访问
- 给同事用需要内网部署URL
