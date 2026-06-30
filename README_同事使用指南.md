# AMER FPP + ai 使用指南（中英双语 + US/CAN）

## 1) 这是什么
- 这是一个给业务操作者使用的网页小工具：上传 CSV，直接生成 FPP 相关输出文档。
- 页面已支持中英文切换、US/CAN 分流程、页面内操作文档。

## 2) 适合谁
- 不懂命令行的操作者；
- 需要在不同电脑上重复执行提效动作的团队成员。

## 3) 跨电脑使用前提
- 安装 Python 3.9+；
- 拿到完整项目文件夹（例如 `工作提效`）；
- 双击执行一键脚本：
  - `一键重启并打开上传文档页.command`（推荐）
  - 或 `一键启动_MVP_后端与网页.command`

> 脚本已改造为“相对路径自适应”，不再依赖某个人电脑的固定目录。

## 4) 页面怎么用（给操作者）
1. 打开页面后先点 `Health Check`；
2. 选择流程：`US Flow` 或 `CAN Flow`；
3. 上传 CSV；
4. 点击生成按钮；
5. 在结果区点击输出链接下载文档。

## 5) 痛点攻坚4按钮（同页）
- `痛点1 自动分摊`：上传 `成本中心人数输入模板.csv`，填写期间/主体/供应商/金额等参数，输出 HC Analysis CSV。
- `痛点2 生成提单`：在上方流程区上传 `提单预填表模板.csv`，输出提单文本块 Markdown。
- `痛点3 成本中心检查`：同时上传“源文件 + 成本中心状态表”，输出有效性检查报告。
- `痛点4 台账自动更新`：上传提单预填文件，可选再上传历史台账，输出最新去重台账。

## 6) 上传哪个文件
- 生成提单文档：上传 `提单预填表模板.csv`（或同结构 CSV）。
- 生成 HC 校验：上传 `HC_Analysis_统一模板.csv`（或同结构 CSV）。

## 7) 常见问题
- 页面报 `Failed to fetch`：后端没启动或端口不对，先用一键脚本重启。
- 端口占用：关闭旧的 Python/uvicorn/http.server 进程后再启动。
- 没有输出链接：检查 CSV 是否为空、字段名是否符合模板。

## 8) 非终端更便捷使用方式
- 双击 `一键重启并打开上传文档页.command`（推荐，自动拉起服务和页面）；
- 直接访问网页入口并使用左侧导航，不需要输入命令；
- 把该项目文件夹打包给操作者，保证双击脚本即可运行。

## 9) English Quick Start
- Start both services with the `.command` launcher.
- Open `upload-docs.html`, run health check first.
- Choose `US` or `CAN` flow, upload CSV, click generate.
- Use the `Pain Points Portal` card for pain #1/#3/#4 actions.
- Download results from output links.
