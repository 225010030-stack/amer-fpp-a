#!/usr/bin/env python3
"""Check submission CSV field health and special cases."""

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

STATUS_FIELDS = ["成本中心校验状态", "期间一致性状态", "金额校验状态"]
OK_VALUES = {"ok", "pass", "yes", "y"}


def get_val(row: dict[str, str], key: str) -> str:
    return (row.get(key) or "").strip()


def is_number(txt: str) -> bool:
    if not txt:
        return False
    try:
        float(txt.replace(",", ""))
        return True
    except ValueError:
        return False


def detect_special_cases(row: dict[str, str]) -> list[str]:
    issues: list[str] = []
    invoice_policy = get_val(row, "Invoice策略").upper()
    a1 = get_val(row, "主附件1")
    a2 = get_val(row, "主附件2")
    a3 = get_val(row, "主附件3")
    other = get_val(row, "Other Attachment")

    # Known historical case: Invoice策略 column got shifted into 主附件1.
    if not invoice_policy and a1.upper() in {"WITH INVOICE", "NO INVOICE"} and not a2 and not a3 and not other:
        issues.append("历史特殊case：Invoice策略疑似列偏移到主附件1")

    # Currency mismatch case.
    trans = get_val(row, "交易币种").upper()
    pay = get_val(row, "支付币种").upper()
    if trans and pay and trans != pay:
        issues.append(f"历史特殊case：交易币种({trans})与支付币种({pay})不一致")

    # Submission blocked without reason.
    submit_flag = get_val(row, "可提交(Y/N)").upper()
    if submit_flag == "N" and not get_val(row, "阻断原因"):
        issues.append("历史特殊case：可提交=N但缺少阻断原因")

    # Amount shape mismatch.
    no_tax = get_val(row, "账单金额(不含税)")
    tax = get_val(row, "税额")
    total = get_val(row, "含税总额")
    if any([no_tax, tax, total]) and not all(is_number(x) or not x for x in [no_tax, tax, total]):
        issues.append("历史特殊case：金额字段存在非数字格式")

    return issues


def check_file(input_path: Path) -> dict[str, object]:
    with input_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            raise ValueError("CSV 缺少表头")
        rows = list(reader)

    missing_columns = [c for c in REQUIRED_FIELDS if c not in (reader.fieldnames or [])]
    row_issues: list[str] = []
    special_cases: list[str] = []
    blocked_rows = 0

    for idx, row in enumerate(rows, start=2):
        for field in REQUIRED_FIELDS:
            if not get_val(row, field):
                row_issues.append(f"L{idx}: 缺少字段值 -> {field}")

        for sf in STATUS_FIELDS:
            val = get_val(row, sf).lower()
            if val and val not in OK_VALUES:
                row_issues.append(f"L{idx}: {sf}={get_val(row, sf)}（未通过）")

        if get_val(row, "可提交(Y/N)").upper() == "N":
            blocked_rows += 1

        for sc in detect_special_cases(row):
            special_cases.append(f"L{idx}: {sc}")

    ok = not missing_columns and not row_issues and not special_cases
    return {
        "ok": ok,
        "rows": len(rows),
        "missing_columns": missing_columns,
        "row_issues": row_issues,
        "special_cases": special_cases,
        "blocked_rows": blocked_rows,
    }


def render_report(result: dict[str, object], input_path: Path) -> str:
    lines: list[str] = []
    lines.append("# 提单文档字段健康检查报告")
    lines.append("")
    lines.append(f"- 输入文件：`{input_path}`")
    lines.append(f"- 行数：`{result['rows']}`")
    lines.append(f"- 可提交标记为N行数：`{result['blocked_rows']}`")
    lines.append(f"- 总体结论：`{'通过' if result['ok'] else '需处理'}`")
    lines.append("")

    missing_columns = result["missing_columns"]
    row_issues = result["row_issues"]
    special_cases = result["special_cases"]

    lines.append("## 1) 字段结构检查")
    if missing_columns:
        for col in missing_columns:
            lines.append(f"- [ ] 缺少表头：{col}")
    else:
        lines.append("- 表头完整。")
    lines.append("")

    lines.append("## 2) 字段值健康检查")
    if row_issues:
        for issue in row_issues[:200]:
            lines.append(f"- [ ] {issue}")
        if len(row_issues) > 200:
            lines.append(f"- ... 其余 {len(row_issues) - 200} 条省略")
    else:
        lines.append("- 字段值检查通过。")
    lines.append("")

    lines.append("## 3) 历史特殊Case识别")
    if special_cases:
        for item in special_cases[:200]:
            lines.append(f"- [ ] {item}")
        if len(special_cases) > 200:
            lines.append(f"- ... 其余 {len(special_cases) - 200} 条省略")
    else:
        lines.append("- 未识别到内置特殊Case。")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Check submission CSV field health")
    parser.add_argument("--input", required=True, help="Input CSV path")
    parser.add_argument("--output", required=True, help="Output markdown report path")
    args = parser.parse_args()

    input_path = Path(args.input).resolve()
    output_path = Path(args.output).resolve()
    if not input_path.exists():
        print(f"输入文件不存在: {input_path}")
        return 2

    result = check_file(input_path)
    report = render_report(result, input_path)
    output_path.write_text(report, encoding="utf-8")
    print(f"DONE: {output_path}")
    print("健康检查完成")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
