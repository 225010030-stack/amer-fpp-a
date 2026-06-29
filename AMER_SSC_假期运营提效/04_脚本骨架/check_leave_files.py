#!/usr/bin/env python3
"""Leave operations input precheck — naming, required files, period consistency."""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

LEAVE_IN_PATTERN = re.compile(
    r"^IN_(US|CAN)_L(\d+)_(.+)_(\d{6})\.csv$", re.IGNORECASE
)


def check_leave_files(root: Path, country: str, period: str) -> list[str]:
    issues: list[str] = []
    upload = root / "上传输入"
    if not upload.is_dir():
        issues.append(f"[阻断] 缺少目录: {upload}")
        return issues

    country = country.upper()
    if country not in {"US", "CAN"}:
        issues.append(f"[阻断] 国家必须是 US 或 CAN，当前: {country}")

    expected = [
        f"IN_{country}_L1_ADP_TimeOff_{period}.csv",
        f"IN_{country}_L1_WD_Absence_{period}.csv",
    ]
    for name in expected:
        p = upload / name
        if not p.is_file():
            issues.append(f"[提示] 建议准备: {name}")

    for p in sorted(upload.glob("IN_*_L*_*.csv")):
        m = LEAVE_IN_PATTERN.match(p.name)
        if not m:
            issues.append(f"[提示] 命名不符合 L 规范: {p.name}")
            continue
        c, _, _, per = m.group(1).upper(), m.group(2), m.group(3), m.group(4)
        if c != country:
            issues.append(f"[阻断] 国家混用: {p.name} (期望 {country})")
        if per != period:
            issues.append(f"[提示] 期间不一致: {p.name} (期望 {period})")

    return issues


def main() -> int:
    ap = argparse.ArgumentParser(description="假期运营上传文件预检")
    ap.add_argument("--root", type=Path, default=Path("."))
    ap.add_argument("--country", required=True, help="US 或 CAN")
    ap.add_argument("--period", required=True, help="YYYYMM")
    ap.add_argument("--fix-report", type=Path, help="输出 Markdown 报告路径")
    args = ap.parse_args()

    issues = check_leave_files(args.root.resolve(), args.country, args.period)
    blockers = [i for i in issues if i.startswith("[阻断]")]
    hints = [i for i in issues if not i.startswith("[阻断]")]

    lines = [
        f"# 假期运营目录预检 · {args.country} · {args.period}",
        "",
        f"- 阻断项: {len(blockers)}",
        f"- 提示项: {len(hints)}",
        "",
    ]
    if blockers:
        lines.append("## 阻断")
        lines.extend(f"- {x}" for x in blockers)
        lines.append("")
    if hints:
        lines.append("## 提示")
        lines.extend(f"- {x}" for x in hints)
        lines.append("")
    if not issues:
        lines.append("全部检查通过。")

    report = "\n".join(lines)
    print(report)

    if args.fix_report:
        args.fix_report.parent.mkdir(parents=True, exist_ok=True)
        args.fix_report.write_text(report, encoding="utf-8")
        print(f"DONE: {args.fix_report.resolve()}")

    return 1 if blockers else 0


if __name__ == "__main__":
    sys.exit(main())
