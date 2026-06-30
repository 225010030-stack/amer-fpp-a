# 给 AI 的实现说明（Web 外壳部分）

> 用途：你同事手里已经有了现成的 `cleaner.py`（Python 数据清洗脚本）。
> **本次任务**：让他的 AI **只生成 Web 外壳**（FastAPI 后端 + 上传页面 + 启动脚本），
> 把 `cleaner.py` 当作一个黑盒函数调用即可。
>
> 同事只需把 `cleaner.py` 和这份说明一起发给 AI。

---

## 一、已有资产（不需要 AI 生成）

✅ `cleaner.py` —— **现成的 Python 清洗脚本，由 HR 提供**

它只暴露一个函数，签名如下：

```python
def clean_ee_listing(
    ee_path: str,
    active_path: str,
    terminated_path: str,
    output_dir: str | None = None,
    output_filename: str | None = None,
) -> str:
    """
    读取 3 个 Excel，做清洗，输出到 output_dir/output_filename

    Returns:
        output_path: 处理后的 Excel 完整路径

    Raises:
        FileNotFoundError: 任一输入文件不存在
        ValueError: 输入文件缺少必要列
    """
```

AI **不需要理解 cleaner.py 内部逻辑**，只需要：
1. 在 `app.py` 里 `from cleaner import clean_ee_listing`
2. 接收前端上传的 3 个文件
3. 调用 `clean_ee_listing(...)` 并返回结果

---

## 二、AI 需要生成的文件清单

| 文件               | 类型       | 说明                          |
| ------------------ | ---------- | ----------------------------- |
| `app.py`           | Python     | FastAPI 后端                  |
| `templates/index.html` | HTML  | 上传页面                       |
| `requirements.txt` | 文本       | 4 个依赖                       |
| `启动.command`     | Shell 脚本 | macOS 一键启动                 |

---

## 三、三个输入文件是什么

| 字段名       | 含义                | 要求         |
| ------------ | ------------------- | ------------ |
| `active`     | 当月在职员工报告    | .xlsx        |
| `terminated` | 当月离职员工报告    | .xlsx        |
| `last_ee`    | 上月最终 EE Listing | .xlsx        |

输出文件命名规则（AI 必须实现）：
- 从 `active` 文件名提取月份缩写：`APR_Active.xlsx` → `APR`
- 输出文件名：`{前缀}_eelisting.xlsx`，例如 `APR_eelisting.xlsx`
- 兜底：当前年月 `YYYYMM_eelisting.xlsx`

提取正则（AI 必须按此实现）：

```python
import re
from datetime import datetime
from pathlib import Path

MONTH_ABBR_PATTERN = re.compile(
    r"^([A-Za-z]{3,4})[_\-\s]*(?:Active|Terminated|EElisting|eelisting|Listing|EE)",
    re.IGNORECASE
)
DIGIT_PREFIX_PATTERN = re.compile(r"^(\d{6})")


def extract_month_prefix(filename: str) -> str:
    if not filename:
        return ""
    stem = Path(filename).stem
    m = MONTH_ABBR_PATTERN.match(stem)
    if m:
        return m.group(1).upper()
    m = DIGIT_PREFIX_PATTERN.match(stem)
    if m:
        return m.group(1)
    return ""


def make_output_filename(active_filename: str) -> str:
    prefix = extract_month_prefix(active_filename)
    if not prefix:
        prefix = datetime.now().strftime("%Y%m")
    return f"{prefix}_eelisting.xlsx"
```

---

## 四、AI 必须实现的功能

### 4.1 FastAPI 后端（`app.py`）

**4 个接口**：

| Method | Path                       | 说明                       |
| ------ | -------------------------- | -------------------------- |
| GET    | `/`                        | 返回上传页面 HTML          |
| POST   | `/process`                 | 接收 3 个文件，调用 cleaner，返回下载链接 |
| GET    | `/download/{filename}`     | 下载处理后的 xlsx          |
| GET    | `/health`                  | 健康检查（可选）           |

**`POST /process` 流程**：

1. 校验 3 个文件名都以 `.xlsx` 结尾
2. 保存 3 个上传文件到 `uploads/{job_id}/` 临时目录
3. 用 `make_output_filename(active.filename)` 生成输出文件名
4. 调用 `clean_ee_listing(ee_path=..., active_path=..., terminated_path=..., output_dir="outputs", output_filename=...)`
5. 清理临时目录
6. 返回 JSON：`{status, output_filename, download_url}`

**`GET /download/{filename}`**：

- 防止路径穿越（禁止 `/` `\` `..`）
- 从 `outputs/` 目录返回文件
- 媒体类型：`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**关键约束**：
- 监听 `0.0.0.0:8000`
- 启动用 `uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)`
- 必须把 `cleaner.py` 同目录加入 `sys.path`

### 4.2 上传页面（`templates/index.html`）

**必须有的元素**：

1. 标题：「📋 EE Listing 月度生成工具」
2. 3 个文件上传 input（`name="active"`, `name="terminated"`, `name="last_ee"`）
3. 实时预览输出文件名（从 active 文件名提取月份前缀）
4. 提交按钮
5. 状态区（processing / success / error 三态）
6. 成功时显示下载链接

**关键约束**：

- **必须用 XMLHttpRequest 提交**（不要用 `fetch` + FormData，在某些 WebView 环境下会失败）
- 给每个 input 加 `accept=".xlsx"`
- 给每个 input 加 `required`
- 状态区要有清晰的成功/失败样式（颜色 + 图标）

### 4.3 依赖（`requirements.txt`）

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
python-multipart==0.0.12
openpyxl==3.1.5
```

（`openpyxl` 是 `cleaner.py` 需要的，必须列上）

### 4.4 启动脚本（`启动.command`）

macOS 一键启动，做这几件事：

1. 切到脚本所在目录
2. 找 `python3`（没有就报错退出）
3. 第一次运行时创建 `venv/` 并装依赖
4. 启动 `app.py`（用 `./venv/bin/python app.py`）
5. 后台 2 秒后用 `open http://localhost:8000` 打开浏览器

需要 `chmod +x` 才能双击运行。

---

## 五、完整参考代码

> AI 可以直接参考以下实现，也可以自由发挥。
> 这些代码都是**生产可用**的，直接复制即可。

### 5.1 `app.py`

```python
import os
import re
import sys
import shutil
import logging
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(__file__).parent
sys.path.insert(0, str(BASE_DIR))
from cleaner import clean_ee_listing

UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

MONTH_ABBR_PATTERN = re.compile(
    r"^([A-Za-z]{3,4})[_\-\s]*(?:Active|Terminated|EElisting|eelisting|Listing|EE)",
    re.IGNORECASE
)
DIGIT_PREFIX_PATTERN = re.compile(r"^(\d{6})")


def extract_month_prefix(filename: str) -> str:
    if not filename:
        return ""
    stem = Path(filename).stem
    m = MONTH_ABBR_PATTERN.match(stem)
    if m:
        return m.group(1).upper()
    m = DIGIT_PREFIX_PATTERN.match(stem)
    if m:
        return m.group(1)
    return ""


def make_output_filename(active_filename: str) -> str:
    prefix = extract_month_prefix(active_filename)
    if not prefix:
        prefix = datetime.now().strftime("%Y%m")
    return f"{prefix}_eelisting.xlsx"


logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ee_listing")

app = FastAPI(title="EE Listing 月度生成工具", version="1.0.0")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")


@app.get("/", response_class=HTMLResponse)
async def home():
    html_path = BASE_DIR / "templates" / "index.html"
    if not html_path.exists():
        raise HTTPException(status_code=500, detail="首页模板缺失")
    return HTMLResponse(html_path.read_text(encoding="utf-8"))


@app.post("/process")
async def process(
    active: UploadFile = File(...),
    terminated: UploadFile = File(...),
    last_ee: UploadFile = File(...),
):
    for f in (active, terminated, last_ee):
        if not f.filename or not f.filename.lower().endswith(".xlsx"):
            raise HTTPException(
                status_code=400,
                detail=f"文件 {f.filename or '(未命名)'} 不是 .xlsx 格式",
            )

    job_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    job_dir = UPLOAD_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    output_filename = make_output_filename(active.filename)
    logger.info(f"[{job_id}] 输出文件名: {output_filename}")

    paths = {
        "active": job_dir / f"active_{active.filename}",
        "terminated": job_dir / f"terminated_{terminated.filename}",
        "last_ee": job_dir / f"last_ee_{last_ee.filename}",
    }
    try:
        for src, dest in zip((active, terminated, last_ee), paths.values()):
            with open(dest, "wb") as f:
                shutil.copyfileobj(src.file, f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件保存失败: {e}")

    try:
        output_path = clean_ee_listing(
            ee_path=str(paths["last_ee"]),
            active_path=str(paths["active"]),
            terminated_path=str(paths["terminated"]),
            output_dir=str(OUTPUT_DIR),
            output_filename=output_filename,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"输入数据有问题: {e}")
    except Exception as e:
        logger.exception(f"[{job_id}] 处理失败")
        raise HTTPException(status_code=500, detail=f"处理失败: {e}")
    finally:
        try:
            shutil.rmtree(job_dir)
        except Exception:
            pass

    output_filename = os.path.basename(output_path)
    return {
        "status": "ok",
        "job_id": job_id,
        "output_filename": output_filename,
        "download_url": f"/download/{output_filename}",
    }


@app.get("/download/{filename}")
async def download(filename: str):
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="非法文件名")
    file_path = OUTPUT_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"文件不存在: {filename}")
    return FileResponse(
        path=str(file_path),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=filename,
    )


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False, log_level="info")
```

### 5.2 `templates/index.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>EE Listing 月度生成工具</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
               max-width: 800px; margin: 40px auto; padding: 20px; background: #f5f7fa; color: #333; }
        .container { background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,.06); }
        h1 { color: #1976d2; margin: 0 0 8px; }
        .subtitle { color: #666; margin: 0 0 24px; font-size: 14px; }
        .upload-group { margin: 16px 0; padding: 16px; border: 2px dashed #d0d7de;
                        border-radius: 8px; background: #fafbfc; }
        .upload-group.has-file { border-color: #4caf50; background: #f1f8e9; }
        .upload-group label { display: block; font-weight: 600; margin-bottom: 6px; }
        .upload-group .desc { font-size: 12px; color: #888; margin-bottom: 8px; }
        .upload-group input[type="file"] { display: block; width: 100%; padding: 8px; }
        .submit-btn { background: #1976d2; color: #fff; border: none; padding: 14px 32px;
                      border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;
                      width: 100%; margin-top: 24px; }
        .submit-btn:disabled { background: #b0bec5; cursor: not-allowed; }
        .status { margin-top: 20px; padding: 16px; border-radius: 8px; display: none; }
        .status.processing { background: #fff8e1; color: #f57c00; display: block; }
        .status.success { background: #e8f5e9; color: #2e7d32; display: block; }
        .status.error { background: #ffebee; color: #c62828; display: block; }
        .download-link { display: inline-block; margin-top: 12px; padding: 10px 20px;
                         background: #2e7d32; color: #fff; text-decoration: none; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📋 EE Listing 月度生成工具</h1>
        <p class="subtitle">上传 3 个文件，自动生成当月 EE Listing</p>
        <form id="uploadForm" enctype="multipart/form-data">
            <div class="upload-group" id="group-active">
                <label>① Active Employee Report *</label>
                <div class="desc">当月在岗员工报告（Workday 导出）</div>
                <input type="file" id="file-active" name="active" accept=".xlsx" required>
            </div>
            <div class="upload-group" id="group-terminated">
                <label>② Terminated Report *</label>
                <div class="desc">当月离职员工报告（Workday 导出）</div>
                <input type="file" id="file-terminated" name="terminated" accept=".xlsx" required>
            </div>
            <div class="upload-group" id="group-last_ee">
                <label>③ 上月 EE Listing *</label>
                <div class="desc">上月最终名单</div>
                <input type="file" id="file-last_ee" name="last_ee" accept=".xlsx" required>
            </div>
            <div id="output-preview" style="margin-top: 20px; padding: 12px 16px;
                 background: #e3f2fd; border-radius: 8px; color: #1565c0; font-size: 14px; display: none;">
                📌 预计输出文件名: <strong id="output-name">—</strong>
            </div>
            <button type="submit" class="submit-btn" id="submitBtn">开始处理</button>
        </form>
        <div class="status" id="status"></div>
    </div>
    <script>
        // 实时预览输出文件名
        function predictOutputName(activeName) {
            if (!activeName) return '';
            const stem = activeName.replace(/\.xlsx$/i, '');
            const m = stem.match(/^([A-Za-z]{3,4})[_\-\s]*(?:Active|Terminated|EElisting|eelisting|Listing|EE)/i);
            if (m) return m.group(1).toUpperCase() + '_eelisting.xlsx';
            return '';
        }
        document.querySelectorAll('input[type="file"]').forEach(input => {
            input.addEventListener('change', e => {
                e.target.closest('.upload-group').classList.toggle('has-file', !!e.target.files[0]);
                if (e.target.name === 'active') {
                    const p = predictOutputName(e.target.files[0]?.name || '');
                    document.getElementById('output-name').textContent = p || '—';
                    document.getElementById('output-preview').style.display = p ? 'block' : 'none';
                }
            });
        });
        // XHR 提交（兼容性最好，避免 fetch + FormData 在某些 WebView 失败）
        const form = document.getElementById('uploadForm');
        const submitBtn = document.getElementById('submitBtn');
        const statusDiv = document.getElementById('status');
        form.addEventListener('submit', e => {
            e.preventDefault();
            const files = {
                active: document.getElementById('file-active').files[0],
                terminated: document.getElementById('file-terminated').files[0],
                last_ee: document.getElementById('file-last_ee').files[0],
            };
            for (const [k, v] of Object.entries(files)) {
                if (!v) { statusDiv.className = 'status error'; statusDiv.textContent = '请选择 ' + k + ' 文件'; return; }
            }
            const formData = new FormData();
            Object.entries(files).forEach(([k, v]) => formData.append(k, v));
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ 处理中...';
            statusDiv.className = 'status processing';
            statusDiv.textContent = '⏳ 正在处理，请稍候...';
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/process', true);
            xhr.timeout = 120000;
            xhr.onload = function () {
                submitBtn.disabled = false;
                submitBtn.textContent = '开始处理';
                if (xhr.status >= 200 && xhr.status < 300) {
                    const r = JSON.parse(xhr.responseText);
                    if (r.status === 'ok') {
                        statusDiv.className = 'status success';
                        statusDiv.innerHTML = '✅ 处理完成！<br>输出: <strong>' + r.output_filename + '</strong><br>' +
                            '<a href="' + r.download_url + '" download class="download-link">📥 下载 ' + r.output_filename + '</a>';
                    } else {
                        statusDiv.className = 'status error';
                        statusDiv.textContent = r.detail || '处理失败';
                    }
                } else {
                    statusDiv.className = 'status error';
                    statusDiv.textContent = '处理失败（HTTP ' + xhr.status + '）';
                }
            };
            xhr.onerror = function () {
                submitBtn.disabled = false;
                submitBtn.textContent = '开始处理';
                statusDiv.className = 'status error';
                statusDiv.textContent = '网络请求失败，请检查后端服务是否启动';
            };
            xhr.send(formData);
        });
    </script>
</body>
</html>
```

### 5.3 `requirements.txt`

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
python-multipart==0.0.12
openpyxl==3.1.5
```

### 5.4 `启动.command`

```bash
#!/bin/bash
cd "$(dirname "$0")"
clear
echo "================================================"
echo "  EE Listing 月度生成工具"
echo "================================================"
PYTHON=""
for cmd in python3 python; do
    if command -v "$cmd" &> /dev/null && "$cmd" --version 2>&1 | grep -q "Python 3"; then
        PYTHON="$cmd"; break
    fi
done
if [ -z "$PYTHON" ]; then
    echo "[错误] 没找到 Python 3"; read -p "按回车键退出..."; exit 1
fi
if [ ! -d "venv" ]; then
    echo "[1/2] 创建虚拟环境..."; $PYTHON -m venv venv
    echo "[2/2] 安装依赖（首次 1-2 分钟）..."; ./venv/bin/pip install --quiet -r requirements.txt
fi
(sleep 2 && open http://localhost:8000) &
./venv/bin/python app.py
```

---

## 六、给 AI 的 prompt（同事直接复制粘贴）

> 把下面整段发给 AI，并把 `cleaner.py` 一起上传：

```
我有一个现成的 Python 脚本 `cleaner.py`，它只暴露一个函数：

```python
def clean_ee_listing(
    ee_path: str,
    active_path: str,
    terminated_path: str,
    output_dir: str | None = None,
    output_filename: str | None = None,
) -> str:
    """
    读取 3 个 Excel，做清洗，输出到 output_dir/output_filename
    Returns: 处理后的 Excel 完整路径
    Raises: FileNotFoundError, ValueError
    """
```

请你帮我**只生成 Web 外壳**（不要碰 cleaner.py 的逻辑）：

需要生成 4 个文件：

1. **app.py** - FastAPI 后端
   - 4 个接口：GET /, POST /process, GET /download/{filename}, GET /health
   - POST /process 接收 3 个文件（active / terminated / last_ee），保存到临时目录，调用 clean_ee_listing，返回 {output_filename, download_url}
   - 输出文件名规则：从 active 文件名提取月份缩写（APR/MAY/JUN...），失败兜底用 YYYYMM，格式 `{PREFIX}_eelisting.xlsx`
   - 监听 0.0.0.0:8000

2. **templates/index.html** - 上传页面
   - 3 个文件 input（name="active" "terminated" "last_ee"）
   - 实时显示预计输出文件名
   - 用 XMLHttpRequest 提交（不要用 fetch，兼容性差）
   - 状态区显示 processing / success / error
   - 成功时显示下载链接

3. **requirements.txt** - 4 个依赖：fastapi, uvicorn[standard], python-multipart, openpyxl

4. **启动.command** - macOS 一键启动
   - 切到脚本所在目录
   - 找 python3
   - 第一次运行建 venv + 装依赖
   - 启动服务，后台 2 秒后 open 浏览器
   - 用 `./venv/bin/python app.py` 运行

参考实现和详细规格见附带文件 `AI_生成说明.md`。

请直接输出 4 个文件的完整代码。
```

---

## 七、验证清单

AI 生成完成后：

- [ ] 把 `cleaner.py` 和 4 个新文件放到同一目录
- [ ] `chmod +x 启动.command`
- [ ] 双击 `启动.command`，浏览器自动打开 `http://localhost:8000`
- [ ] 上传 3 个测试 Excel，能正常下载结果
- [ ] 输出文件名形如 `APR_eelisting.xlsx`
