# AMER FPP + ai Operator Guide (EN)

## What this tool does
- Local web tool for US/CAN FPP workflows.
- Upload CSV templates and generate output files directly.
- Includes masking upload, analytics dashboard, queue, and history.

## Start in 1 minute
1. Double-click `一键重启并打开上传文档页.command`.
2. Open `http://127.0.0.1:18081/upload-docs.html`.
3. Click `Health Check`.
4. Select `US` or `CAN`.
5. Upload a template and click a main action button.

## Files to test quickly
- Submission Blocks: `提单预填表模板.csv`
- HC Check: `HC_Analysis_统一模板.csv`
- Doc Field Health Check: `提单预填表模板.csv`
- Analytics Dashboard: `提单预填表模板.csv`

## Mask upload + auto recovery
- Toggle `Mask Upload (Auto Recover Output)` on Output page.
- The system masks sensitive fields before processing.
- It auto-generates recovered output files with `_恢复版` suffix.
- It also outputs a `脱敏映射_*.json` mapping file for audit.
