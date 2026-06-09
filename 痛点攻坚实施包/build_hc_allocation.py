#!/usr/bin/env python3
"""Pain point #1: auto-build HC allocation from headcount input."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path


def to_float(val: str) -> float:
    txt = (val or "").strip().replace(",", "")
    return float(txt) if txt else 0.0


def main() -> int:
    parser = argparse.ArgumentParser(description="Build HC allocation CSV from headcount list")
    parser.add_argument("--input", required=True, help="Input CSV (must include 成本中心, 人数)")
    parser.add_argument("--output", required=True, help="Output HC Analysis CSV")
    parser.add_argument("--period", required=True, help="Period, e.g. 202606")
    parser.add_argument("--country", required=True, help="Country, e.g. US/CA")
    parser.add_argument("--entity", required=True, help="Entity name")
    parser.add_argument("--vendor", required=True, help="Vendor name")
    parser.add_argument("--fee-type", required=True, help="Fee type name")
    parser.add_argument("--invoice-total", required=True, type=float, help="Invoice total amount")
    parser.add_argument("--currency", required=True, help="Currency, e.g. USD/CAD")
    args = parser.parse_args()

    in_path = Path(args.input).resolve()
    out_path = Path(args.output).resolve()
    if not in_path.exists():
        print(f"Input not found: {in_path}")
        return 2

    with in_path.open("r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        print("Input CSV has no rows")
        return 2

    required = {"成本中心", "人数"}
    if not required.issubset(set(rows[0].keys())):
        print("Input CSV must include columns: 成本中心, 人数")
        return 2

    total_people = sum(to_float(r.get("人数", "")) for r in rows)
    if total_people <= 0:
        print("Total 人数 must be > 0")
        return 2

    output_rows = []
    allocated_sum = 0.0
    for idx, r in enumerate(rows):
        people = to_float(r.get("人数", ""))
        pct = people / total_people
        amount = round(args.invoice_total * pct, 2)
        allocated_sum += amount
        output_rows.append(
            {
                "期间": args.period,
                "国家": args.country,
                "主体": args.entity,
                "供应商": args.vendor,
                "费用类型": args.fee_type,
                "账单总额": f"{args.invoice_total:.2f}",
                "币种": args.currency,
                "成本中心": (r.get("成本中心") or "").strip(),
                "部门": (r.get("部门") or "").strip(),
                "人数": str(int(people) if people.is_integer() else people),
                "人数占比(PCT)": f"{pct:.10f}",
                "分摊金额": f"{amount:.2f}",
                "校验_行状态": "OK",
                "备注": "",
            }
        )

    # Tail difference adjustment on last row.
    diff = round(args.invoice_total - allocated_sum, 2)
    if output_rows and abs(diff) > 0:
        last_amt = to_float(output_rows[-1]["分摊金额"])
        output_rows[-1]["分摊金额"] = f"{last_amt + diff:.2f}"
        output_rows[-1]["备注"] = f"尾差调平 {diff:+.2f}"

    fields = [
        "期间",
        "国家",
        "主体",
        "供应商",
        "费用类型",
        "账单总额",
        "币种",
        "成本中心",
        "部门",
        "人数",
        "人数占比(PCT)",
        "分摊金额",
        "校验_行状态",
        "备注",
    ]
    with out_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(output_rows)

    print(f"Generated: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
