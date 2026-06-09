#!/usr/bin/env python3
"""Pain point #4: upsert ledger from prefill CSV to avoid漏更/晚更/重复."""

from __future__ import annotations

import argparse
import csv
from datetime import datetime
from pathlib import Path


LEDGER_FIELDS = [
    "期间",
    "国家",
    "主体",
    "供应商",
    "费用类型",
    "Payment Description",
    "含税总额",
    "交易币种",
    "可提交(Y/N)",
    "FPP单号",
    "提单日期",
    "提交人",
    "状态",
    "最后更新时间",
]


def key_of(row: dict[str, str]) -> str:
    return "|".join(
        [
            (row.get("期间") or "").strip(),
            (row.get("国家") or "").strip(),
            (row.get("主体") or "").strip(),
            (row.get("供应商") or "").strip(),
            (row.get("费用类型") or "").strip(),
            (row.get("Payment Description") or "").strip(),
        ]
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Upsert ledger records from prefill CSV")
    parser.add_argument("--prefill", required=True, help="提单预填表 CSV path")
    parser.add_argument("--ledger", required=True, help="台账 CSV path")
    args = parser.parse_args()

    prefill = Path(args.prefill).resolve()
    ledger = Path(args.ledger).resolve()
    if not prefill.exists():
        print(f"Prefill file not found: {prefill}")
        return 2

    with prefill.open("r", encoding="utf-8-sig", newline="") as f:
        source_rows = list(csv.DictReader(f))

    existing_rows: list[dict[str, str]] = []
    if ledger.exists():
        with ledger.open("r", encoding="utf-8-sig", newline="") as f:
            existing_rows = list(csv.DictReader(f))

    existing_map = {key_of(r): r for r in existing_rows if key_of(r)}
    now = datetime.now().isoformat(timespec="seconds")
    created = 0
    updated = 0

    for s in source_rows:
        row = {
            "期间": (s.get("期间") or "").strip(),
            "国家": (s.get("国家") or "").strip(),
            "主体": (s.get("主体") or "").strip(),
            "供应商": (s.get("供应商") or "").strip(),
            "费用类型": (s.get("费用类型") or "").strip(),
            "Payment Description": (s.get("Payment Description") or "").strip(),
            "含税总额": (s.get("含税总额") or "").strip(),
            "交易币种": (s.get("交易币种") or "").strip(),
            "可提交(Y/N)": (s.get("可提交(Y/N)") or "").strip(),
            "FPP单号": (s.get("FPP单号") or "").strip(),
            "提单日期": (s.get("提单日期") or "").strip(),
            "提交人": (s.get("提交人") or "").strip(),
            "状态": "已提交" if (s.get("FPP单号") or "").strip() and (s.get("FPP单号") or "").strip() != "待填写" else "待提交",
            "最后更新时间": now,
        }
        k = key_of(row)
        if not k:
            continue
        if k in existing_map:
            existing_map[k].update(row)
            updated += 1
        else:
            existing_map[k] = row
            created += 1

    rows = list(existing_map.values())
    rows.sort(key=lambda r: (r.get("期间", ""), r.get("国家", ""), r.get("供应商", ""), r.get("Payment Description", "")))

    ledger.parent.mkdir(parents=True, exist_ok=True)
    with ledger.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=LEDGER_FIELDS)
        w.writeheader()
        w.writerows(rows)

    print(f"Ledger updated: {ledger}")
    print(f"created={created}, updated={updated}, total={len(rows)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
