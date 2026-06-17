#!/usr/bin/env python3
"""Preview headcount roster grouped by OU/Entity — matches Excel Pivot (Count of 员工ID)."""

from __future__ import annotations

import argparse
import csv
from collections import defaultdict
from pathlib import Path


OU_ALIASES = ("OU", "Entity", "主体", "entity", "ou")
ID_ALIASES = ("员工ID", "Employee ID", "employee_id", "Associate ID", "associate_id")
DEPT_ALIASES = ("部门", "Department", "department")
CC_ALIASES = ("成本中心", "Center", "center", "cost_center")
HEAD_ALIASES = ("人数", "headcount", "Headcount")


def pick_col(fieldnames: list[str], aliases: tuple[str, ...]) -> str | None:
    keys = {k.strip(): k for k in fieldnames}
    for a in aliases:
        if a in keys:
            return keys[a]
    return None


def read_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def norm_ou(val: str) -> str:
    return (val or "").strip()


def main() -> int:
    parser = argparse.ArgumentParser(description="OU pivot preview for headcount roster (2.0)")
    parser.add_argument("--input", required=True, help="Roster CSV (员工ID+OU+部门+成本中心)")
    parser.add_argument("--output", help="Markdown report path (optional)")
    parser.add_argument("--summary-csv", help="OU summary CSV path (optional)")
    args = parser.parse_args()

    in_path = Path(args.input).resolve()
    if not in_path.is_file():
        print(f"Input not found: {in_path}")
        return 2

    rows = read_rows(in_path)
    if not rows:
        print("Input CSV has no rows")
        return 2

    fields = list(rows[0].keys())
    ou_col = pick_col(fields, OU_ALIASES)
    id_col = pick_col(fields, ID_ALIASES)
    dept_col = pick_col(fields, DEPT_ALIASES)
    cc_col = pick_col(fields, CC_ALIASES)
    head_col = pick_col(fields, HEAD_ALIASES)

    employee_mode = id_col is not None
    aggregate_mode = head_col is not None and cc_col is not None

    if not employee_mode and not aggregate_mode:
        print("CSV must be either:")
        print("  (A) 员工ID + OU + 部门 + 成本中心  — one row per employee")
        print("  (B) OU + 成本中心 + 部门 + 人数      — aggregated headcount")
        return 2

    ou_counts: dict[str, int] = defaultdict(int)
    ou_cc_counts: dict[tuple[str, str], int] = defaultdict(int)
    ou_cc_dept: dict[tuple[str, str, str], int] = defaultdict(int)
    blank_ou_rows = 0
    seen_ids: set[str] = set()
    duplicate_ids: list[str] = []

    for row in rows:
        ou = norm_ou(row.get(ou_col, "") if ou_col else "")
        if not ou:
            blank_ou_rows += 1
            ou = "(blank)"

        if employee_mode:
            eid = (row.get(id_col or "", "") or "").strip()
            if not eid:
                continue
            if eid in seen_ids:
                duplicate_ids.append(eid)
            seen_ids.add(eid)
            ou_counts[ou] += 1
            cc = (row.get(cc_col or "", "") or "").strip() if cc_col else ""
            dept = (row.get(dept_col or "", "") or "").strip() if dept_col else ""
            if cc:
                ou_cc_counts[(ou, cc)] += 1
            if cc or dept:
                ou_cc_dept[(ou, cc, dept)] += 1
        else:
            n_raw = (row.get(head_col or "", "") or "").strip().replace(",", "")
            try:
                n = int(float(n_raw)) if n_raw else 0
            except ValueError:
                n = 0
            if n <= 0:
                continue
            ou_counts[ou] += n
            cc = (row.get(cc_col or "", "") or "").strip() if cc_col else ""
            dept = (row.get(dept_col or "", "") or "").strip() if dept_col else ""
            if cc:
                ou_cc_counts[(ou, cc)] += n
            if cc or dept:
                ou_cc_dept[(ou, cc, dept)] += n

    grand = sum(ou_counts.values())
    lines = [
        "# 人力名单 · OU 人数 Pivot 预检",
        "",
        f"- 输入文件：`{in_path}`",
        f"- 模式：`{'员工明细' if employee_mode else '汇总人数'}`",
        f"- Grand Total：**{grand}**",
        "",
        "## 按 OU / Entity（应对照 Excel Pivot）",
        "",
        "| OU / Entity | Count of 员工ID | 状态 |",
        "|-------------|-----------------|------|",
    ]

    for ou in sorted(ou_counts.keys(), key=lambda x: (x == "(blank)", x)):
        cnt = ou_counts[ou]
        status = "⚠ 缺 OU" if ou == "(blank)" else "OK"
        lines.append(f"| {ou} | {cnt} | {status} |")
    lines.append(f"| **Grand Total** | **{grand}** | |")

    if blank_ou_rows:
        lines.extend(["", f"⚠ 有 **{blank_ou_rows}** 行 OU/Entity 为空，已计入 `(blank)`。"])
    if duplicate_ids:
        uniq = sorted(set(duplicate_ids))[:20]
        lines.extend(["", f"⚠ 重复员工 ID（前 20）：{', '.join(uniq)}"])

    lines.extend(["", "## 按 OU + 成本中心（分摊时分母范围）", "", "| OU | 成本中心 | 人数 |", "|----|----------|------|"])
    for (ou, cc), cnt in sorted(ou_cc_counts.items(), key=lambda x: (x[0][0], x[0][1])):
        lines.append(f"| {ou} | {cc} | {cnt} |")

    lines.extend(["", "## 按 OU + 成本中心 + 部门", "", "| OU | 成本中心 | 部门 | 人数 |", "|----|----------|------|------|"])
    for (ou, cc, dept), cnt in sorted(ou_cc_dept.items(), key=lambda x: (x[0][0], x[0][1], x[0][2])):
        lines.append(f"| {ou} | {cc} | {dept} | {cnt} |")

    lines.extend([
        "",
        "## 分摊提醒",
        "",
        "- 台账按 **OU + 供应商** 分组金额；分摊时 **只使用该 OU 下人数** 作分母，不用 Grand Total 跨 OU。",
        "- 同一成本中心下多部门人数已在上一表分别列出，脚本分摊时应先汇总到 CC 再算占比。",
        "",
    ])

    report = "\n".join(lines)
    print(report)

    if args.output:
        out = Path(args.output).resolve()
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(report, encoding="utf-8")
        print(f"\nDONE: {out}")

    if args.summary_csv:
        csv_path = Path(args.summary_csv).resolve()
        csv_path.parent.mkdir(parents=True, exist_ok=True)
        with csv_path.open("w", encoding="utf-8-sig", newline="") as f:
            w = csv.writer(f)
            w.writerow(["OU", "count_of_employee_id", "status"])
            for ou in sorted(ou_counts.keys(), key=lambda x: (x == "(blank)", x)):
                status = "blank_ou" if ou == "(blank)" else "ok"
                w.writerow([ou, ou_counts[ou], status])
            w.writerow(["Grand Total", grand, ""])
        print(f"DONE: {csv_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
