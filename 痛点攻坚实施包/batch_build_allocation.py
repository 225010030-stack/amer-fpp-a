#!/usr/bin/env python3
"""Batch HC allocation from ledger: many vendors may share one headcount basis (many-to-one)."""

from __future__ import annotations

import argparse
import csv
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from build_hc_allocation import build_allocation_rows, load_headcount_csv, write_allocation_csv


def parse_filters(raw: str) -> list[str]:
    if not raw or not str(raw).strip():
        return []
    parts = re.split(r"[;；,，|]", str(raw))
    return [p.strip() for p in parts if p.strip()]


def load_vendor_map(path: Optional[Path]) -> list[dict[str, Any]]:
    if not path or not path.is_file():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    rules: list[dict[str, Any]] = []
    for r in rows:
        vendor = (r.get("供应商") or r.get("vendor") or "").strip()
        if not vendor:
            continue
        rules.append(
            {
                "vendor": vendor,
                "fee_type": (r.get("费用类型") or r.get("fee_type") or "").strip(),
                "basis_id": (r.get("分摊依据ID") or r.get("basis_id") or "DEFAULT").strip() or "DEFAULT",
                "departments": parse_filters(r.get("部门过滤") or r.get("departments") or ""),
                "cost_centers": parse_filters(r.get("成本中心过滤") or r.get("cost_centers") or ""),
            }
        )
    return rules


def resolve_rule(vendor: str, fee_type: str, rules: list[dict[str, Any]]) -> dict[str, Any]:
    vendor = vendor.strip()
    fee_type = fee_type.strip()
    for r in rules:
        if r["vendor"] == vendor and r.get("fee_type") and r["fee_type"] == fee_type:
            return r
    for r in rules:
        if r["vendor"] == vendor and not r.get("fee_type"):
            return r
    return {"basis_id": "DEFAULT", "departments": [], "cost_centers": []}


def filter_headcount_rows(
    rows: list[dict[str, str]],
    departments: list[str],
    cost_centers: list[str],
) -> list[dict[str, str]]:
    if not departments and not cost_centers:
        return rows
    dept_set = set(departments)
    cc_set = set(cost_centers)
    out: list[dict[str, str]] = []
    for r in rows:
        dept = (r.get("部门") or "").strip()
        cc = (r.get("成本中心") or "").strip()
        if departments and dept not in dept_set:
            continue
        if cost_centers and cc not in cc_set:
            continue
        out.append(r)
    return out


def ledger_group_key(row: dict[str, str]) -> str:
    return "|".join(
        [
            (row.get("期间") or "").strip(),
            (row.get("国家") or "").strip().upper(),
            (row.get("主体") or "").strip(),
            (row.get("供应商") or "").strip(),
            (row.get("费用类型") or "").strip(),
        ]
    )


def load_ledger_rows(path: Path, period: str, country: str) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    period = period.strip()
    country = country.strip().upper()
    country_aliases = {country}
    if country in {"US", "USA"}:
        country_aliases.update({"US", "USA"})
    if country in {"CAN", "CA"}:
        country_aliases.update({"CAN", "CA"})

    grouped: dict[str, dict[str, Any]] = {}
    for r in rows:
        p = (r.get("期间") or "").strip()
        c = (r.get("国家") or "").strip().upper()
        if p != period:
            continue
        if c not in country_aliases:
            continue
        amount_raw = (r.get("含税总额") or r.get("账单总额") or "").strip().replace(",", "")
        try:
            amount = float(amount_raw) if amount_raw else 0.0
        except ValueError:
            amount = 0.0
        if amount <= 0:
            continue
        key = ledger_group_key(r)
        if key not in grouped:
            grouped[key] = {
                "期间": p,
                "国家": (r.get("国家") or "").strip(),
                "主体": (r.get("主体") or "").strip(),
                "供应商": (r.get("供应商") or "").strip(),
                "费用类型": (r.get("费用类型") or "").strip(),
                "交易币种": (r.get("交易币种") or r.get("币种") or "").strip(),
                "含税总额": 0.0,
                "_source_rows": 0,
            }
        grouped[key]["含税总额"] += amount
        grouped[key]["_source_rows"] += 1
        if not grouped[key]["交易币种"]:
            grouped[key]["交易币种"] = (r.get("交易币种") or r.get("币种") or "").strip()

    out: list[dict[str, str]] = []
    for g in grouped.values():
        total = g.pop("含税总额")
        g.pop("_source_rows", None)
        g["含税总额"] = f"{total:.2f}"
        out.append({k: str(v) for k, v in g.items()})
    out.sort(key=lambda x: (x.get("供应商", ""), x.get("费用类型", "")))
    return out


def safe_slug(text: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9._-]+", "_", (text or "vendor").strip())
    return slug.strip("_") or "vendor"


def build_report_md(
    period: str,
    country: str,
    results: list[dict[str, Any]],
    skipped: list[dict[str, str]],
) -> str:
    lines = [
        "# 批量分摊报告（台账驱动）",
        "",
        f"- 账期：`{period}`",
        f"- 国家/地区：`{country}`",
        f"- 生成时间：{datetime.now().isoformat(timespec='seconds')}",
        "",
        "## 说明",
        "",
        "- **多对一**：多家供应商可共用同一份人数表（分摊依据 DEFAULT）；",
        "- 若某供应商只分摊部分部门/成本中心，在映射 CSV 里配置「部门过滤/成本中心过滤」；",
        "- 若需不同人数表，上传多份 P1 并在映射里指定「分摊依据ID」。",
        "",
        f"## 成功 {len(results)} 家",
        "",
        "（台账/Prefill 若有多行同一供应商，已按 **供应商+费用类型+主体** 汇总含税总额后再分摊。）",
        "",
        "| 供应商 | 费用类型 | 主体 | 金额 | 分摊依据 | 部门过滤 | 输出 |",
        "|--------|----------|------|------|----------|----------|------|",
    ]
    for r in results:
        lines.append(
            f"| {r.get('vendor','')} | {r.get('fee_type','')} | {r.get('entity','')} | "
            f"{r.get('amount','')} | {r.get('basis_id','DEFAULT')} | {r.get('dept_filter','—')} | `{r.get('output','')}` |"
        )
    if skipped:
        lines.extend(["", f"## 跳过 {len(skipped)} 行", ""])
        for s in skipped:
            lines.append(f"- {s.get('reason','')}: {s.get('vendor','')} / {s.get('fee_type','')}")
    return "\n".join(lines) + "\n"


def run_batch(
    *,
    ledger_path: Path,
    headcount_by_basis: dict[str, Path],
    period: str,
    country: str,
    output_dir: Path,
    vendor_map_path: Optional[Path] = None,
) -> dict[str, Any]:
    ledger_rows = load_ledger_rows(ledger_path, period, country)
    if not ledger_rows:
        raise ValueError(f"No ledger rows for period={period} country={country} with 含税总额 > 0")

    if "DEFAULT" not in headcount_by_basis:
        raise ValueError("Must provide DEFAULT headcount CSV (shared by vendors)")

    basis_cache: dict[str, list[dict[str, str]]] = {}
    for bid, p in headcount_by_basis.items():
        basis_cache[bid] = load_headcount_csv(p)

    rules = load_vendor_map(vendor_map_path)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    region_tag = "CAN" if country.upper() in {"CAN", "CA"} else "US"
    output_dir.mkdir(parents=True, exist_ok=True)

    results: list[dict[str, Any]] = []
    skipped: list[dict[str, str]] = []
    outputs: list[str] = []

    for row in ledger_rows:
        vendor = (row.get("供应商") or "").strip()
        fee_type = (row.get("费用类型") or "").strip()
        entity = (row.get("主体") or "").strip()
        currency = (row.get("交易币种") or row.get("币种") or ("CAD" if region_tag == "CAN" else "USD")).strip()
        amount_raw = (row.get("含税总额") or "").strip().replace(",", "")
        try:
            invoice_total = float(amount_raw)
        except ValueError:
            skipped.append({"vendor": vendor, "fee_type": fee_type, "reason": "金额无效"})
            continue

        rule = resolve_rule(vendor, fee_type, rules)
        basis_id = rule.get("basis_id") or "DEFAULT"
        if basis_id not in basis_cache:
            skipped.append({"vendor": vendor, "fee_type": fee_type, "reason": f"缺少分摊依据 {basis_id}"})
            continue

        hc_rows = filter_headcount_rows(
            basis_cache[basis_id],
            rule.get("departments") or [],
            rule.get("cost_centers") or [],
        )
        if not hc_rows:
            skipped.append({"vendor": vendor, "fee_type": fee_type, "reason": "部门/成本中心过滤后无人数行"})
            continue

        try:
            out_rows = build_allocation_rows(
                hc_rows,
                period=period,
                country=(row.get("国家") or country).strip(),
                entity=entity,
                vendor=vendor,
                fee_type=fee_type,
                invoice_total=invoice_total,
                currency=currency,
                basis_id=basis_id,
            )
        except ValueError as exc:
            skipped.append({"vendor": vendor, "fee_type": fee_type, "reason": str(exc)})
            continue

        out_name = f"HC_Analysis_{region_tag}_{safe_slug(vendor)}_{period}_{ts}.csv"
        out_path = output_dir / out_name
        write_allocation_csv(out_rows, out_path)
        outputs.append(str(out_path))
        dept_filter = ";".join(rule.get("departments") or []) or "—"
        results.append(
            {
                "vendor": vendor,
                "fee_type": fee_type,
                "entity": entity,
                "amount": f"{invoice_total:.2f}",
                "basis_id": basis_id,
                "dept_filter": dept_filter,
                "output": str(out_path),
                "rows": len(out_rows),
            }
        )

    report_path = output_dir / f"批量分摊报告_{region_tag}_{period}_{ts}.md"
    report_path.write_text(build_report_md(period, country, results, skipped), encoding="utf-8")
    summary_path = output_dir / f"批量分摊结果_{region_tag}_{period}_{ts}.json"
    summary_path.write_text(
        json.dumps({"ok": True, "results": results, "skipped": skipped, "outputs": outputs + [str(report_path)]}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    outputs.extend([str(report_path), str(summary_path)])

    return {
        "ok": True,
        "period": period,
        "country": country,
        "vendor_count": len(results),
        "skipped_count": len(skipped),
        "results": results,
        "skipped": skipped,
        "outputs": outputs,
        "report_path": str(report_path),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Batch allocate all vendors from ledger CSV")
    parser.add_argument("--ledger", required=True, help="Ledger or prefill CSV")
    parser.add_argument("--headcount", required=True, help="Default headcount CSV (DEFAULT basis)")
    parser.add_argument("--period", required=True, help="YYYYMM")
    parser.add_argument("--country", required=True, help="US / CAN / CA")
    parser.add_argument("--output-dir", required=True, help="Output directory")
    parser.add_argument("--vendor-map", default="", help="Optional vendor→basis/dept filter CSV")
    parser.add_argument(
        "--extra-headcount",
        action="append",
        default=[],
        help="Extra basis files as basis_id=path (repeatable)",
    )
    args = parser.parse_args()

    headcount_by_basis = {"DEFAULT": Path(args.headcount).resolve()}
    for item in args.extra_headcount or []:
        if "=" not in item:
            continue
        bid, p = item.split("=", 1)
        headcount_by_basis[bid.strip()] = Path(p.strip()).resolve()

    result = run_batch(
        ledger_path=Path(args.ledger).resolve(),
        headcount_by_basis=headcount_by_basis,
        period=args.period.strip(),
        country=args.country.strip(),
        output_dir=Path(args.output_dir).resolve(),
        vendor_map_path=Path(args.vendor_map).resolve() if args.vendor_map else None,
    )
    print(json.dumps({"vendor_count": result["vendor_count"], "skipped": result["skipped_count"], "report": result["report_path"]}, ensure_ascii=False))
    return 0 if result["vendor_count"] > 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
