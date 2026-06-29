#!/usr/bin/env python3
"""ADP vs WD leave reconciliation skeleton — deterministic, no LLM math."""
from __future__ import annotations

import argparse
import csv
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class DiffRow:
    employee_key: str
    dimension: str
    adp_value: str
    wd_value: str
    severity: str  # blocker | hint | ok
    message: str


@dataclass
class ReconcileResult:
    country: str
    period: str
    diffs: list[DiffRow] = field(default_factory=list)
    prepayroll_rows: list[dict] = field(default_factory=list)

    @property
    def blockers(self) -> list[DiffRow]:
        return [d for d in self.diffs if d.severity == "blocker"]

    @property
    def hints(self) -> list[DiffRow]:
        return [d for d in self.diffs if d.severity == "hint"]


def read_csv(path: Path) -> list[dict]:
    with path.open(newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def load_id_map(path: Path | None) -> dict[str, str]:
    """wd_employee_id -> adp_associate_id"""
    if not path or not path.is_file():
        return {}
    mapping: dict[str, str] = {}
    for row in read_csv(path):
        wd = (row.get("wd_employee_id") or "").strip()
        adp = (row.get("adp_associate_id") or "").strip()
        if wd and adp:
            mapping[wd] = adp
            mapping[adp] = wd
    return mapping


def index_rows(rows: list[dict], key_cols: list[str]) -> dict[str, list[dict]]:
    idx: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        key = "|".join((row.get(c) or "").strip() for c in key_cols)
        if key.strip("|"):
            idx[key].append(row)
    return idx


def reconcile(
    country: str,
    period: str,
    adp_rows: list[dict],
    wd_rows: list[dict],
    id_map: dict[str, str],
) -> ReconcileResult:
    result = ReconcileResult(country=country, period=period)

    adp_by_emp = index_rows(adp_rows, ["employee_id", "associate_id", "Employee ID"])
    wd_by_emp = index_rows(wd_rows, ["employee_id", "Employee ID", "Worker ID"])

    adp_keys = set(adp_by_emp)
    wd_keys = set(wd_by_emp)
    all_keys = adp_keys | wd_keys

    for key in sorted(all_keys):
        in_adp = key in adp_keys
        in_wd = key in wd_keys
        if not in_adp:
            result.diffs.append(
                DiffRow(key, "presence", "", "WD only", "blocker", "ADP 无对应记录")
            )
            continue
        if not in_wd:
            result.diffs.append(
                DiffRow(key, "presence", "ADP only", "", "blocker", "WD 无对应记录")
            )
            continue

        adp_row = adp_by_emp[key][0]
        wd_row = wd_by_emp[key][0]

        adp_bal = (adp_row.get("balance") or adp_row.get("Balance") or "").strip()
        wd_bal = (wd_row.get("balance") or wd_row.get("Balance") or "").strip()
        if adp_bal and wd_bal and adp_bal != wd_bal:
            result.diffs.append(
                DiffRow(
                    key,
                    "balance",
                    adp_bal,
                    wd_bal,
                    "blocker",
                    "余额不一致",
                )
            )
        elif adp_bal and wd_bal:
            result.prepayroll_rows.append(
                {
                    "employee_key": key,
                    "pay_period": period,
                    "country": country,
                    "adp_balance": adp_bal,
                    "wd_balance": wd_bal,
                    "blocker_flag": "",
                    "notes": "auto-matched",
                }
            )

        adp_date = (adp_row.get("leave_date") or adp_row.get("Date") or "").strip()
        wd_date = (wd_row.get("absence_date") or wd_row.get("Date") or "").strip()
        if adp_date and wd_date and adp_date != wd_date:
            result.diffs.append(
                DiffRow(
                    key,
                    "date",
                    adp_date,
                    wd_date,
                    "hint",
                    "休假日期不一致（请人工确认）",
                )
            )

    if not id_map:
        result.diffs.append(
            DiffRow(
                "_global_",
                "id_map",
                "",
                "",
                "hint",
                "未提供员工 ID 映射表，仅按导出文件主键比对",
            )
        )

    return result


def write_outputs(root: Path, result: ReconcileResult) -> Path:
    out_dir = root / "上传输出"
    out_dir.mkdir(parents=True, exist_ok=True)
    tag = f"{result.country}_{result.period}"
    summary = out_dir / f"Leave_Reconcile_{tag}.md"
    detail = out_dir / f"Leave_Diff_Detail_{tag}.csv"
    blockers = out_dir / f"Leave_Blockers_{tag}.md"
    pack = out_dir / f"Prepayroll_LeaveInput_{tag}.csv"

    summary.write_text(
        "\n".join(
            [
                f"# Leave Reconcile · {result.country} · {result.period}",
                "",
                f"- 阻断: {len(result.blockers)}",
                f"- 提示: {len(result.hints)}",
                f"- Prepayroll 候选行: {len(result.prepayroll_rows)}",
                "",
                "详见同目录 Diff / Blockers / Prepayroll CSV。",
            ]
        ),
        encoding="utf-8",
    )

    with detail.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["employee_key", "dimension", "adp", "wd", "severity", "message"])
        for d in result.diffs:
            w.writerow([d.employee_key, d.dimension, d.adp_value, d.wd_value, d.severity, d.message])

    block_lines = [f"# Leave Blockers · {tag}", ""]
    if result.blockers:
        for d in result.blockers:
            block_lines.append(f"- **{d.employee_key}** [{d.dimension}] {d.message}")
    else:
        block_lines.append("无阻断项。")
    blockers.write_text("\n".join(block_lines), encoding="utf-8")

    if result.prepayroll_rows:
        with pack.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(result.prepayroll_rows[0].keys()))
            w.writeheader()
            w.writerows(result.prepayroll_rows)

    return summary


def main() -> int:
    ap = argparse.ArgumentParser(description="ADP vs WD 假期比对（骨架版）")
    ap.add_argument("--root", type=Path, default=Path("."))
    ap.add_argument("--country", required=True)
    ap.add_argument("--period", required=True)
    ap.add_argument("--adp", type=Path, required=True)
    ap.add_argument("--wd", type=Path, required=True)
    ap.add_argument("--id-map", type=Path)
    ap.add_argument("--type-map", type=Path)
    args = ap.parse_args()

    root = args.root.resolve()
    if not args.adp.is_file():
        print(f"ERROR: ADP file not found: {args.adp}", file=sys.stderr)
        return 2
    if not args.wd.is_file():
        print(f"ERROR: WD file not found: {args.wd}", file=sys.stderr)
        return 2

    id_map = load_id_map(args.id_map)
    result = reconcile(
        args.country.upper(),
        args.period,
        read_csv(args.adp),
        read_csv(args.wd),
        id_map,
    )
    summary_path = write_outputs(root, result)
    print(f"DONE: {summary_path}")
    print(f"DONE: {summary_path.parent / f'Leave_Diff_Detail_{args.country.upper()}_{args.period}.csv'}")
    if result.blockers:
        print(f"BLOCKERS: {len(result.blockers)}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
