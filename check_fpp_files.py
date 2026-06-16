#!/usr/bin/env python3
"""FPP folder quality checker.

Checks three categories:
1) Missing files/folders
2) Naming issues
3) Period mismatch between folder month and file names
"""

from __future__ import annotations

import argparse
import os
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable


MONTH_RE = re.compile(r"^20\d{4}$")
PERIOD6_RE = re.compile(r"(?<!\d)(20\d{2})(0[1-9]|1[0-2])(?!\d)")
PERIOD4_RE = re.compile(r"(?<!\d)(2\d)(0[1-9]|1[0-2])(?!\d)")


@dataclass
class Issue:
    level: str
    category: str
    path: str
    detail: str


def classify_for_fix(issue: Issue) -> str:
    """Classify issue into quick-fix vs manual-confirm buckets."""
    if issue.category == "命名错误":
        return "可立即修复"
    if issue.category == "期间不一致":
        return "需人工确认"
    if issue.category == "缺文件":
        # Creating folders is quick, but data completeness still needs owner judgment.
        if "缺少该期间目录" in issue.detail:
            return "可立即修复"
        return "需人工确认"
    return "需人工确认"


def collect_months(root: Path) -> list[str]:
    months: set[str] = set()
    for p in root.rglob("*"):
        if p.is_dir() and MONTH_RE.fullmatch(p.name):
            months.add(p.name)
    return sorted(months)


def has_any_file(path: Path, suffixes: tuple[str, ...]) -> bool:
    if not path.exists() or not path.is_dir():
        return False
    lowered = tuple(s.lower() for s in suffixes)
    for item in path.rglob("*"):
        if item.is_file() and item.suffix.lower() in lowered:
            return True
    return False


def iter_files(path: Path) -> Iterable[Path]:
    if not path.exists() or not path.is_dir():
        return []
    return (x for x in path.rglob("*") if x.is_file())


def parse_period_candidates(file_name: str) -> list[str]:
    periods: set[str] = set()
    for y, m in PERIOD6_RE.findall(file_name):
        periods.add(f"{y}{m}")
    for yy, mm in PERIOD4_RE.findall(file_name):
        periods.add(f"20{yy}{mm}")
    return sorted(periods)


def previous_month(yyyymm: str) -> str:
    dt = datetime.strptime(yyyymm, "%Y%m")
    if dt.month == 1:
        return f"{dt.year - 1}12"
    return f"{dt.year}{dt.month - 1:02d}"


def check_period_mismatch(base: Path, month: str, issues: list[Issue]) -> None:
    for file_path in iter_files(base):
        candidates = parse_period_candidates(file_path.name)
        if not candidates:
            continue
        # If file name includes period info, month folder should be present among candidates.
        if month not in candidates:
            issues.append(
                Issue(
                    "WARN",
                    "期间不一致",
                    str(file_path),
                    f"目录期间={month}, 文件名期间候选={candidates}",
                )
            )


def check_us_benefits(root: Path, months: list[str], issues: list[Issue]) -> None:
    base = root / "USA" / "Benefits Insurance"
    if not base.exists():
        issues.append(Issue("ERROR", "缺文件", str(base), "缺少目录"))
        return

    canonical_invoice = "月度账单invoice"

    for vendor in sorted(x for x in base.iterdir() if x.is_dir() and not x.name.startswith(".")):
        # Naming rule for vendor folders
        if not re.match(r"^\d+\.\s", vendor.name):
            issues.append(Issue("WARN", "命名错误", str(vendor), "供应商目录建议使用“编号. 名称”格式"))

        month_dirs = sorted(x.name for x in vendor.iterdir() if x.is_dir() and MONTH_RE.fullmatch(x.name))
        if not month_dirs:
            # No month folders is treated as missing coverage.
            issues.append(Issue("WARN", "缺文件", str(vendor), "未发现任何月度目录(20YYYY)"))
            continue

        for m in months:
            month_path = vendor / m
            if not month_path.exists():
                issues.append(Issue("ERROR", "缺文件", str(month_path), "缺少该期间目录"))
                continue

            hc_dir = month_path / "HC Analysis"
            if not hc_dir.exists():
                issues.append(Issue("ERROR", "缺文件", str(hc_dir), "缺少 HC Analysis 目录"))
            elif not has_any_file(hc_dir, (".xlsx", ".xls", ".csv")):
                issues.append(Issue("ERROR", "缺文件", str(hc_dir), "HC Analysis 下没有数据文件"))

            invoice_dirs = [d for d in month_path.iterdir() if d.is_dir() and "月度账单" in d.name]
            if not invoice_dirs:
                issues.append(Issue("ERROR", "缺文件", str(month_path), "缺少月度账单目录"))
            else:
                # Naming issue: invoice folder not canonical
                for inv in invoice_dirs:
                    if inv.name != canonical_invoice:
                        issues.append(
                            Issue(
                                "WARN",
                                "命名错误",
                                str(inv),
                                f"建议统一为 {canonical_invoice}",
                            )
                        )
                    if not has_any_file(inv, (".pdf", ".xlsx", ".xls", ".csv")):
                        issues.append(Issue("ERROR", "缺文件", str(inv), "月度账单目录下没有账单文件"))
                    check_period_mismatch(inv, m, issues)

            if hc_dir.exists():
                check_period_mismatch(hc_dir, m, issues)


def check_us_hr_service(root: Path, months: list[str], issues: list[Issue]) -> None:
    base = root / "USA" / "HR Service Fee"
    if not base.exists():
        issues.append(Issue("ERROR", "缺文件", str(base), "缺少目录"))
        return

    cyc = base / "CYC- Service Fee"
    if cyc.exists():
        for m in months:
            mp = cyc / m
            if not mp.exists():
                issues.append(Issue("ERROR", "缺文件", str(mp), "缺少该期间目录"))
                continue
            if not has_any_file(mp, (".pdf", ".xlsx", ".xls", ".csv")):
                issues.append(Issue("ERROR", "缺文件", str(mp), "目录下没有费用文件"))
            check_period_mismatch(mp, m, issues)

    adp = base / "ADP Pay By Pay - HR Service Fee"
    if adp.exists():
        # ADP currently uses one invoice pool folder; only ensure invoice files exist.
        invoice_dirs = [d for d in adp.rglob("*") if d.is_dir() and "月度账单" in d.name]
        if invoice_dirs and not any(has_any_file(d, (".pdf", ".xlsx", ".xls")) for d in invoice_dirs):
            issues.append(Issue("WARN", "缺文件", str(adp), "存在月度账单目录，但未发现账单文件"))


def check_can_sunlife(root: Path, months: list[str], issues: list[Issue]) -> None:
    base = root / "CAN" / "SunLife - Medical Insurance"
    if not base.exists():
        issues.append(Issue("ERROR", "缺文件", str(base), "缺少目录"))
        return

    for m in months:
        mp = base / m
        if not mp.exists():
            issues.append(Issue("ERROR", "缺文件", str(mp), "缺少该期间目录"))
            continue

        if not has_any_file(mp, (".pdf",)):
            issues.append(Issue("ERROR", "缺文件", str(mp), "缺少发票 PDF"))
        if not has_any_file(mp, (".xlsx", ".xls")):
            issues.append(Issue("ERROR", "缺文件", str(mp), "缺少对账/明细 Excel"))

        check_period_mismatch(mp, m, issues)


def check_hc_source(root: Path, months: list[str], issues: list[Issue]) -> None:
    base = root / "数据来源 - 海外人力数"
    if not base.exists():
        issues.append(Issue("ERROR", "缺文件", str(base), "缺少目录"))
        return

    # Expected month mapping: previous month data for current month submission
    for m in months:
        # e.g. 202602 expects "HC Analysis 202601 for 202602"
        prev = previous_month(m)
        expected = base / f"HC Analysis {prev} for {m}"
        if not expected.exists():
            issues.append(Issue("WARN", "缺文件", str(expected), "未发现对应期间 HC 数据目录"))
            continue
        if not has_any_file(expected, (".xlsx", ".xls", ".csv")):
            issues.append(Issue("ERROR", "缺文件", str(expected), "HC 数据目录缺少数据文件"))


def print_report(issues: list[Issue]) -> int:
    errors = [x for x in issues if x.level == "ERROR"]
    warns = [x for x in issues if x.level == "WARN"]

    print("\n=== FPP 文件检查报告 ===")
    print(f"ERROR: {len(errors)}  WARN: {len(warns)}  TOTAL: {len(issues)}")

    for item in issues:
        print(f"[{item.level}] {item.category} | {item.path} | {item.detail}")

    return 1 if errors else 0


def write_fix_report(issues: list[Issue], report_path: Path) -> None:
    quick = [x for x in issues if classify_for_fix(x) == "可立即修复"]
    manual = [x for x in issues if classify_for_fix(x) == "需人工确认"]

    lines: list[str] = []
    lines.append("# 待修复清单")
    lines.append("")
    lines.append("> 由 `check_fpp_files.py --fix-report` 自动生成")
    lines.append("")
    lines.append(f"- 总问题数：{len(issues)}")
    lines.append(f"- 可立即修复：{len(quick)}")
    lines.append(f"- 需人工确认：{len(manual)}")
    lines.append("")
    lines.append("## 可立即修复")
    lines.append("")
    if not quick:
        lines.append("- 无")
    else:
        for i, item in enumerate(quick, 1):
            lines.append(
                f"- [ ] {i}. `{item.category}` | `{item.path}` | {item.detail}"
            )
    lines.append("")
    lines.append("## 需人工确认")
    lines.append("")
    if not manual:
        lines.append("- 无")
    else:
        for i, item in enumerate(manual, 1):
            lines.append(
                f"- [ ] {i}. `{item.category}` | `{item.path}` | {item.detail}"
            )
    lines.append("")
    lines.append("## 处理记录")
    lines.append("")
    lines.append("- [ ] 已修复后重新执行检查脚本并留档")
    lines.append("")

    report_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Check FPP folder completeness and naming.")
    parser.add_argument(
        "--root",
        default=".",
        help="Root folder of FPP files (default: current directory)",
    )
    parser.add_argument(
        "--months",
        default="",
        help="Comma-separated months like 202601,202602 (default: auto-detect)",
    )
    parser.add_argument(
        "--fix-report",
        default="",
        help="Write markdown fix report to this file path",
    )
    parser.add_argument(
        "--country",
        default="ALL",
        choices=["ALL", "US", "CAN"],
        help="Limit checks to US, CAN, or ALL (default ALL)",
    )
    args = parser.parse_args()

    root = Path(args.root).resolve()
    if not root.exists():
        print(f"Root not found: {root}")
        return 2

    if args.months.strip():
        months = [x.strip() for x in args.months.split(",") if MONTH_RE.fullmatch(x.strip())]
    else:
        months = collect_months(root)

    if not months:
        print("No month directories detected. Provide --months manually.")
        return 2

    issues: list[Issue] = []
    country = (args.country or "ALL").upper()
    if country in {"ALL", "US"}:
        check_us_benefits(root, months, issues)
        check_us_hr_service(root, months, issues)
    if country in {"ALL", "CAN"}:
        check_can_sunlife(root, months, issues)
    check_hc_source(root, months, issues)

    if args.fix_report.strip():
        report_path = Path(args.fix_report).expanduser().resolve()
        write_fix_report(issues, report_path)
        print(f"\nFix report written: {report_path}")

    return print_report(issues)


if __name__ == "__main__":
    raise SystemExit(main())
