#!/usr/bin/env python3
"""Detect duplicate ledger rows (2.0 step 1 warning report — does not block)."""

from __future__ import annotations

import argparse
import csv
from collections import defaultdict
from pathlib import Path


KEY_FIELDS = [
    "期间",
    "国家",
    "主体",
    "供应商",
    "费用类型",
    "Payment Description",
]


def row_key(row: dict[str, str]) -> str:
    return "|".join((row.get(f) or "").strip() for f in KEY_FIELDS)


def main() -> int:
    parser = argparse.ArgumentParser(description="Ledger duplicate detection report (2.0)")
    parser.add_argument("--ledger", required=True, help="台账 CSV path")
    parser.add_argument("--output", help="Markdown report path (optional)")
    args = parser.parse_args()

    ledger = Path(args.ledger).resolve()
    if not ledger.is_file():
        print(f"Ledger file not found: {ledger}")
        return 2

    with ledger.open("r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))

    if not rows:
        report = "\n".join([
            "# 财务台账 · 去重预警报告",
            "",
            f"- 输入文件：`{ledger}`",
            "- 总行数：**0**（仅表头或空文件）",
            "",
            "ℹ 无数据行，跳过重复检测。",
            "",
        ])
        print(report)
        if args.output:
            out = Path(args.output).resolve()
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(report, encoding="utf-8")
            print(f"\nDONE: {out}")
        return 0

    groups: dict[str, list[tuple[int, dict[str, str]]]] = defaultdict(list)
    for i, row in enumerate(rows, start=2):
        k = row_key(row)
        if not k.replace("|", "").strip():
            continue
        groups[k].append((i, row))

    dup_groups = {k: v for k, v in groups.items() if len(v) > 1}
    lines = [
        "# 财务台账 · 去重预警报告",
        "",
        f"- 输入文件：`{ledger}`",
        f"- 总行数：**{len(rows)}**",
        f"- 重复组数：**{len(dup_groups)}**",
        "",
    ]

    if not dup_groups:
        lines.extend(["✅ 未发现重复键（期间+国家+主体+供应商+费用类型+Payment Description）。", ""])
    else:
        lines.extend([
            "⚠ 以下分组存在重复行，请人工核对是否应合并或保留特殊 case。",
            "**本报告不锁定后续操作。**",
            "",
        ])
        for idx, (k, items) in enumerate(sorted(dup_groups.items(), key=lambda x: -len(x[1])), start=1):
            parts = k.split("|")
            lines.append(f"## 重复组 {idx}（{len(items)} 行）")
            lines.append("")
            lines.append("| 字段 | 值 |")
            lines.append("|------|-----|")
            for field, val in zip(KEY_FIELDS, parts):
                lines.append(f"| {field} | {val or '—'} |")
            lines.append("")
            lines.append("| 行号 | 含税总额 | FPP单号 | 状态 |")
            lines.append("|------|----------|---------|------|")
            for row_no, row in items:
                lines.append(
                    f"| {row_no} | {(row.get('含税总额') or '—').strip()} | "
                    f"{(row.get('FPP单号') or '—').strip()} | {(row.get('状态') or '—').strip()} |"
                )
            lines.append("")

    report = "\n".join(lines)
    print(report)

    if args.output:
        out = Path(args.output).resolve()
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(report, encoding="utf-8")
        print(f"\nDONE: {out}")

    return 0 if not dup_groups else 1


if __name__ == "__main__":
    raise SystemExit(main())
