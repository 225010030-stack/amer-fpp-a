#!/usr/bin/env python3
"""Generate copy-paste FPP submission text blocks from CSV."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path


REQUIRED_FIELDS = [
    "期间",
    "国家",
    "主体",
    "供应商",
    "费用类型",
    "FPP场景",
    "Document Category",
    "交易币种",
    "支付币种",
    "Payment Description",
    "Invoice策略",
]


def get(row: dict[str, str], key: str) -> str:
    return (row.get(key) or "").strip()


def join_non_empty(parts: list[str], sep: str = " | ") -> str:
    values = [x for x in parts if x]
    return sep.join(values) if values else "（未填写）"


def attachment_summary(row: dict[str, str]) -> str:
    return join_non_empty(
        [
            get(row, "主附件1"),
            get(row, "主附件2"),
            get(row, "主附件3"),
            get(row, "Other Attachment"),
        ]
    )


def normalize_row(row: dict[str, str]) -> dict[str, str]:
    """Auto-fix common column-shift case in template rows."""
    fixed = dict(row)
    invoice_policy = get(fixed, "Invoice策略")
    a1 = get(fixed, "主附件1")
    a2 = get(fixed, "主附件2")
    a3 = get(fixed, "主附件3")
    other = get(fixed, "Other Attachment")

    policy_tokens = {"WITH INVOICE", "NO INVOICE"}
    if not invoice_policy and a1.upper() in policy_tokens and not a2 and not a3 and not other:
        fixed["Invoice策略"] = a1
        fixed["主附件1"] = ""
    return fixed


def blocking_issues(row: dict[str, str]) -> list[str]:
    issues: list[str] = []
    for field in REQUIRED_FIELDS:
        if not get(row, field):
            issues.append(f"缺少字段：{field}")

    for chk in ["成本中心校验状态", "期间一致性状态", "金额校验状态"]:
        val = get(row, chk).lower()
        if val and val not in {"ok", "pass", "yes", "y"}:
            issues.append(f"{chk} = {get(row, chk)}（未通过）")

    submit_flag = get(row, "可提交(Y/N)").upper()
    if submit_flag == "N":
        reason = get(row, "阻断原因") or "未填写阻断原因"
        issues.append(f"可提交标记为N：{reason}")

    return issues


def build_block(row: dict[str, str], idx: int) -> str:
    row = normalize_row(row)
    title = join_non_empty(
        [
            get(row, "期间"),
            get(row, "国家"),
            get(row, "供应商"),
            get(row, "费用类型"),
        ],
        sep=" / ",
    )

    lines: list[str] = []
    lines.append(f"## 提单块 {idx}: {title}")
    lines.append("")
    lines.append("### 基本信息")
    lines.append(f"- 期间：{get(row, '期间') or '（未填写）'}")
    lines.append(f"- 国家：{get(row, '国家') or '（未填写）'}")
    lines.append(f"- 主体：{get(row, '主体') or '（未填写）'}")
    lines.append(f"- 供应商：{get(row, '供应商') or '（未填写）'}")
    lines.append(f"- 费用类型：{get(row, '费用类型') or '（未填写）'}")
    lines.append("")
    lines.append("### FPP 录入字段（可直接复制）")
    lines.append(f"- 场景：{get(row, 'FPP场景') or '（未填写）'}")
    lines.append(f"- 文档分类：{get(row, 'Document Category') or '（未填写）'}")
    lines.append(f"- 合同号：{get(row, '合同号') or '（未填写）'}")
    lines.append(f"- 交易币种：{get(row, '交易币种') or '（未填写）'}")
    lines.append(f"- 支付币种：{get(row, '支付币种') or '（未填写）'}")
    lines.append(f"- 不含税金额：{get(row, '账单金额(不含税)') or '（未填写）'}")
    lines.append(f"- 税额：{get(row, '税额') or '（未填写）'}")
    lines.append(f"- 含税总额：{get(row, '含税总额') or '（未填写）'}")
    lines.append(f"- Payment Description：{get(row, 'Payment Description') or '（未填写）'}")
    lines.append(f"- Invoice策略：{get(row, 'Invoice策略') or '（未填写）'}")
    lines.append("")
    lines.append("### 审批与组织信息")
    lines.append(f"- Requester：{get(row, 'Requester') or '（未填写）'}")
    lines.append(f"- Business Reviewer：{get(row, 'Business Reviewer') or '（未填写）'}")
    lines.append(f"- Department：{get(row, 'Department') or '（未填写）'}")
    lines.append(f"- Center：{get(row, 'Center') or '（未填写）'}")
    lines.append("")
    lines.append("### 附件清单")
    lines.append(f"- 附件：{attachment_summary(row)}")
    lines.append("")
    lines.append("### 提交前状态")
    lines.append(f"- 成本中心校验状态：{get(row, '成本中心校验状态') or '（未填写）'}")
    lines.append(f"- 期间一致性状态：{get(row, '期间一致性状态') or '（未填写）'}")
    lines.append(f"- 金额校验状态：{get(row, '金额校验状态') or '（未填写）'}")
    lines.append(f"- 可提交(Y/N)：{get(row, '可提交(Y/N)') or '（未填写）'}")
    lines.append("")

    issues = blocking_issues(row)
    if issues:
        lines.append("### 阻断项（需先处理）")
        for issue in issues:
            lines.append(f"- [ ] {issue}")
    else:
        lines.append("### 阻断项（需先处理）")
        lines.append("- 无，可进入提单。")

    lines.append("")
    return "\n".join(lines)


def load_rows(input_path: Path) -> list[dict[str, str]]:
    with input_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            raise ValueError("CSV 缺少表头")
        return list(reader)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate FPP submission copy blocks from CSV")
    parser.add_argument("--input", default="./提单预填表模板.csv", help="Input CSV path")
    parser.add_argument("--output", default="./FPP提单文本块.md", help="Output markdown path")
    parser.add_argument("--only-ready", action="store_true", help="Only include rows with 可提交(Y/N)=Y")
    args = parser.parse_args()

    in_path = Path(args.input).resolve()
    out_path = Path(args.output).resolve()
    if not in_path.exists():
        print(f"输入文件不存在: {in_path}")
        return 2

    rows = load_rows(in_path)
    if args.only_ready:
        rows = [r for r in rows if get(normalize_row(r), "可提交(Y/N)").upper() == "Y"]

    lines: list[str] = []
    lines.append("# FPP 提单文本块（自动生成）")
    lines.append("")
    lines.append(f"- 输入文件：`{in_path}`")
    lines.append(f"- 总行数：{len(rows)}")
    lines.append("")

    for idx, row in enumerate(rows, start=1):
        lines.append(build_block(row, idx))

    out_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"生成完成: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
