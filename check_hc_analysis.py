#!/usr/bin/env python3
"""Validate HC Analysis CSV for allocation quality checks."""

from __future__ import annotations

import argparse
import csv
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path


@dataclass
class Finding:
    level: str
    group: str
    detail: str


REQUIRED_COLUMNS = [
    "期间",
    "国家",
    "主体",
    "供应商",
    "费用类型",
    "账单总额",
    "币种",
    "成本中心",
    "人数",
    "人数占比(PCT)",
    "分摊金额",
]


def to_float(value: str) -> float:
    txt = (value or "").strip().replace(",", "")
    if not txt:
        return 0.0
    return float(txt)


def group_key(row: dict[str, str]) -> str:
    return "|".join(
        [
            row.get("期间", "").strip(),
            row.get("国家", "").strip(),
            row.get("主体", "").strip(),
            row.get("供应商", "").strip(),
            row.get("费用类型", "").strip(),
            row.get("币种", "").strip(),
        ]
    )


def validate_rows(rows: list[dict[str, str]], pct_tolerance: float, amount_tolerance: float) -> list[Finding]:
    findings: list[Finding] = []
    groups: dict[str, list[dict[str, str]]] = defaultdict(list)

    for idx, row in enumerate(rows, start=2):
        missing = [c for c in REQUIRED_COLUMNS if not (row.get(c) or "").strip()]
        if missing:
            findings.append(
                Finding(
                    "ERROR",
                    f"行{idx}",
                    f"缺少必填字段: {missing}",
                )
            )
            continue
        groups[group_key(row)].append(row)

    for key, items in groups.items():
        try:
            bill_totals = {round(to_float(x["账单总额"]), 2) for x in items}
            if len(bill_totals) != 1:
                findings.append(Finding("ERROR", key, f"同一组账单总额不一致: {sorted(bill_totals)}"))
                continue

            bill_total = list(bill_totals)[0]
            total_people = sum(to_float(x["人数"]) for x in items)
            total_pct = sum(to_float(x["人数占比(PCT)"]) for x in items)
            total_amount = sum(to_float(x["分摊金额"]) for x in items)

            if total_people <= 0:
                findings.append(Finding("ERROR", key, "总人数必须大于0"))

            if abs(total_pct - 1.0) > pct_tolerance:
                findings.append(
                    Finding("ERROR", key, f"PCT合计异常: 当前={total_pct:.6f}, 期望=1.000000")
                )

            diff = round(total_amount - bill_total, 2)
            if abs(diff) > amount_tolerance:
                findings.append(
                    Finding("ERROR", key, f"分摊金额合计不等于账单总额: 合计={total_amount:.2f}, 账单={bill_total:.2f}, 差额={diff:.2f}")
                )
            elif abs(diff) > 0:
                findings.append(
                    Finding("WARN", key, f"存在尾差: 合计={total_amount:.2f}, 账单={bill_total:.2f}, 差额={diff:.2f}")
                )

            for row in items:
                pct = to_float(row["人数占比(PCT)"])
                amt = to_float(row["分摊金额"])
                expected = bill_total * pct
                if abs(amt - expected) > max(amount_tolerance, 0.05):
                    findings.append(
                        Finding(
                            "WARN",
                            key,
                            f"成本中心 {row.get('成本中心','')} 金额与PCT不匹配: 当前={amt:.2f}, 期望={expected:.2f}",
                        )
                    )
        except ValueError as exc:
            findings.append(Finding("ERROR", key, f"数值字段格式错误: {exc}"))

    return findings


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            raise ValueError("CSV 为空或缺少表头")
        return list(reader)


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate HC Analysis allocation CSV")
    parser.add_argument("--file", default="./HC_Analysis_统一模板.csv", help="CSV path")
    parser.add_argument("--pct-tolerance", type=float, default=0.001, help="Tolerance for PCT sum")
    parser.add_argument("--amount-tolerance", type=float, default=0.01, help="Tolerance for amount sum")
    args = parser.parse_args()

    target = Path(args.file).resolve()
    if not target.exists():
        print(f"File not found: {target}")
        return 2

    try:
        rows = load_csv(target)
    except Exception as exc:  # pylint: disable=broad-except
        print(f"读取失败: {exc}")
        return 2

    findings = validate_rows(rows, args.pct_tolerance, args.amount_tolerance)
    errors = [x for x in findings if x.level == "ERROR"]
    warns = [x for x in findings if x.level == "WARN"]

    print("=== HC Analysis 校验报告 ===")
    print(f"文件: {target}")
    print(f"ERROR: {len(errors)}  WARN: {len(warns)}  TOTAL: {len(findings)}")
    for item in findings:
        print(f"[{item.level}] {item.group} | {item.detail}")

    if not findings:
        print("检查通过：未发现问题。")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
