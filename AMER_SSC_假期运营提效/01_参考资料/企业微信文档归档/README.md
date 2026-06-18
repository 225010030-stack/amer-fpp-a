# 企业微信文档归档

归档时间：2026-06-18  
GitHub 仓库：[225010030-stack/amer-fpp-a](https://github.com/225010030-stack/amer-fpp-a)

## 主文档（用户提供的 3 个链接）

| # | 标题 | 类型 | 源链接 | 本地归档 |
|---|------|------|--------|----------|
| 1 | HRSSC Operation Issue & Proposal | 文档 | [打开](https://doc.weixin.qq.com/doc/w3_AdAAHQbZAP8SGIXTMOSIaTouR7cfn?scode=AJEAIQdfAAoCEIm00y) | [`01_HRSSC_Operation_Issue_and_Proposal/`](01_HRSSC_Operation_Issue_and_Proposal/) |
| 2 | Pre-Payroll Quality Improvement Log | 表格 | [打开](https://doc.weixin.qq.com/sheet/e3_AQwAOwZHAP4b6OX8D2bQV0d6N3N06?scode=AJEAIQdfAAode0xkV4) | [`02_PrePayroll_Quality_Improvement_Log/`](02_PrePayroll_Quality_Improvement_Log/) |
| 3 | 海外HRSSC福利&并薪运营梳理-2026 | 表格 | [打开](https://doc.weixin.qq.com/sheet/e3_ATgA9gYhADkCNDEQQVQaMQAuGzqbz?scode=AJEAIQdfAAoHZK3Lxd) | [`03_海外HRSSC福利并薪运营梳理_2026/`](03_海外HRSSC福利并薪运营梳理_2026/) |

## 嵌套链接文档（从主文档跳转发现）

| 标题 | 源链接 | 本地归档 |
|------|--------|----------|
| HRSSC C&B Request Tracking Form | [打开](https://doc.weixin.qq.com/sheet/e3_ATgA9gYhADkCNUHhFCB4YSV0VdlIp?scode=AJEAIQdfAAo6sRfhUYATgA9gYhADk) | [`04_HRSSC_CB_Request_Tracking_Form/`](04_HRSSC_CB_Request_Tracking_Form/) |

完整嵌套链接清单（含尚未解析 URL 的条目）见 [`links_registry.md`](links_registry.md)。

## 导出完整 Excel / Word 原件

企业微信文档需登录后才能导出。在本机已登录企业微信的前提下运行：

```bash
cd "/Users/zhangwenjing/Desktop/工作提效"
python3 AMER_SSC_假期运营提效/05_脚本/export_weixin_docs.py
```

脚本会打开浏览器窗口，依次导出 xlsx/docx 到 `_downloads/`，并更新 `manifest.json`。

## 目录说明

```
企业微信文档归档/
├── README.md                 ← 本文件
├── manifest.json             ← 机器可读清单
├── links_registry.md         ← 表格/文档内嵌链接索引
├── 01_HRSSC_Operation_Issue_and_Proposal/
├── 02_PrePayroll_Quality_Improvement_Log/
├── 03_海外HRSSC福利并薪运营梳理_2026/   ← 含运营清单摘录
├── 04_HRSSC_CB_Request_Tracking_Form/
└── _downloads/               ← 运行导出脚本后生成 xlsx/docx
```
