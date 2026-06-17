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


def build_rule_index(rules: list[dict[str, Any]]) -> tuple[dict[tuple[str, str], dict[str, Any]], dict[str, dict[str, Any]]]:
    exact: dict[tuple[str, str], dict[str, Any]] = {}
    vendor_only: dict[str, dict[str, Any]] = {}
    for r in rules:
        v = r["vendor"]
        ft = (r.get("fee_type") or "").strip()
        if ft:
            exact[(v, ft)] = r
        else:
            vendor_only[v] = r
    return exact, vendor_only


def lookup_rule(
    vendor: str,
    fee_type: str,
    exact: dict[tuple[str, str], dict[str, Any]],
    vendor_only: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    vendor = vendor.strip()
    fee_type = fee_type.strip()
    if (vendor, fee_type) in exact:
        return exact[(vendor, fee_type)]
    if vendor in vendor_only:
        return vendor_only[vendor]
    return {"basis_id": "DEFAULT", "departments": [], "cost_centers": []}


def filter_cache_key(basis_id: str, departments: list[str], cost_centers: list[str]) -> tuple[str, tuple[str, ...], tuple[str, ...]]:
    return (basis_id, tuple(sorted(departments)), tuple(sorted(cost_centers)))


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


def load_ledger_rows(path: Path, period: str, country: str) -> tuple[list[dict[str, str]], dict[str, int]]:
    """Stream-read ledger; aggregate by vendor group. Returns (groups, stats)."""
    period = period.strip()
    country = country.strip().upper()
    country_aliases = {country}
    if country in {"US", "USA"}:
        country_aliases.update({"US", "USA"})
    if country in {"CAN", "CA"}:
        country_aliases.update({"CAN", "CA"})

    grouped: dict[str, dict[str, Any]] = {}
    stats = {"lines_scanned": 0, "lines_matched": 0, "lines_skipped_no_amount": 0}

    with path.open("r", encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            stats["lines_scanned"] += 1
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
                stats["lines_skipped_no_amount"] += 1
                continue
            stats["lines_matched"] += 1
            key = ledger_group_key(r)
            cur = (r.get("交易币种") or r.get("币种") or "").strip()
            if key not in grouped:
                grouped[key] = {
                    "期间": p,
                    "国家": (r.get("国家") or "").strip(),
                    "主体": (r.get("主体") or "").strip(),
                    "供应商": (r.get("供应商") or "").strip(),
                    "费用类型": (r.get("费用类型") or "").strip(),
                    "交易币种": cur,
                    "含税总额": 0.0,
                    "_source_rows": 0,
                }
            grouped[key]["含税总额"] += amount
            grouped[key]["_source_rows"] += 1
            if cur and grouped[key]["交易币种"] and grouped[key]["交易币种"] != cur:
                grouped[key]["_currency_mixed"] = True
            elif cur and not grouped[key]["交易币种"]:
                grouped[key]["交易币种"] = cur

    out: list[dict[str, str]] = []
    for g in grouped.values():
        total = g.pop("含税总额")
        src = g.pop("_source_rows", 0)
        g.pop("_currency_mixed", None)
        g["含税总额"] = f"{total:.2f}"
        g["_source_rows"] = str(src)
        out.append({k: str(v) for k, v in g.items()})
    out.sort(key=lambda x: (x.get("供应商", ""), x.get("费用类型", ""), x.get("主体", "")))
    stats["vendor_groups"] = len(out)
    return out, stats


def safe_slug(text: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9._-]+", "_", (text or "vendor").strip())
    return slug.strip("_") or "vendor"


def build_report_md(
    period: str,
    country: str,
    results: list[dict[str, Any]],
    skipped: list[dict[str, str]],
    stats: dict[str, int],
    *,
    table_limit: int = 120,
) -> str:
    lines = [
        "# 批量分摊报告（台账驱动）",
        "",
        f"- 账期：`{period}`",
        f"- 国家/地区：`{country}`",
        f"- 生成时间：{datetime.now().isoformat(timespec='seconds')}",
        "",
        "## 数据规模",
        "",
        f"- 扫描台账行数：`{stats.get('lines_scanned', 0)}`",
        f"- 匹配本账期且有金额：`{stats.get('lines_matched', 0)}`",
        f"- 汇总为供应商组：`{stats.get('vendor_groups', len(results))}`",
        f"- 成功分摊：`{len(results)}` · 跳过：`{len(skipped)}`",
        "",
        "## 说明",
        "",
        "- **多对一**：多家供应商可共用同一份人数表（分摊依据 DEFAULT）；",
        "- 台账/Prefill **几万行**（按成本中心拆行）会先汇总为「供应商+费用类型+主体」再分摊；",
        "- 若某供应商只分摊部分部门/成本中心，在映射 CSV 里配置过滤。",
        "",
        f"## 成功 {len(results)} 组",
        "",
        "| 供应商 | 费用类型 | 主体 | 金额 | 汇总行数 | 分摊依据 | 部门过滤 | 输出 |",
        "|--------|----------|------|------|----------|----------|----------|------|",
    ]
    shown = results[:table_limit]
    for r in shown:
        lines.append(
            f"| {r.get('vendor','')} | {r.get('fee_type','')} | {r.get('entity','')} | "
            f"{r.get('amount','')} | {r.get('source_rows','—')} | {r.get('basis_id','DEFAULT')} | "
            f"{r.get('dept_filter','—')} | `{Path(str(r.get('output',''))).name}` |"
        )
    if len(results) > table_limit:
        lines.append(f"| … | … | … | … | … | … | … | 另有 {len(results) - table_limit} 组见 JSON 摘要 |")
    if skipped:
        lines.extend(["", f"## 跳过 {len(skipped)} 组", ""])
        for s in skipped[:50]:
            lines.append(f"- {s.get('reason','')}: {s.get('vendor','')} / {s.get('fee_type','')}")
        if len(skipped) > 50:
            lines.append(f"- … 另有 {len(skipped) - 50} 条见 JSON 摘要")
    return "\n".join(lines) + "\n"


def output_filename(region_tag: str, vendor: str, fee_type: str, entity: str, period: str, ts: str, seq: int) -> str:
    parts = [
        "HC_Analysis",
        region_tag,
        safe_slug(vendor)[:40],
        safe_slug(fee_type)[:24],
        safe_slug(entity)[:24],
        period,
        ts,
        f"{seq:03d}",
    ]
    return "_".join(p for p in parts if p) + ".csv"


def run_batch(
    *,
    ledger_path: Path,
    headcount_by_basis: dict[str, Path],
    period: str,
    country: str,
    output_dir: Path,
    vendor_map_path: Optional[Path] = None,
) -> dict[str, Any]:
    ledger_rows, stats = load_ledger_rows(ledger_path, period, country)
    if not ledger_rows:
        raise ValueError(
            f"No ledger rows for period={period} country={country} with 含税总额 > 0 "
            f"(scanned {stats.get('lines_scanned', 0)} lines)"
        )

    if "DEFAULT" not in headcount_by_basis:
        raise ValueError("Must provide DEFAULT headcount CSV (shared by vendors)")

    basis_cache: dict[str, list[dict[str, str]]] = {}
    for bid, p in headcount_by_basis.items():
        basis_cache[bid] = load_headcount_csv(p)
    stats["headcount_rows_default"] = len(basis_cache.get("DEFAULT") or [])

    rules = load_vendor_map(vendor_map_path)
    rule_exact, rule_vendor_only = build_rule_index(rules)
    filter_cache: dict[tuple[str, tuple[str, ...], tuple[str, ...]], list[dict[str, str]]] = {}

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    region_tag = "CAN" if country.upper() in {"CAN", "CA"} else "US"
    output_dir.mkdir(parents=True, exist_ok=True)

    results: list[dict[str, Any]] = []
    skipped: list[dict[str, str]] = []
    outputs: list[str] = []

    for seq, row in enumerate(ledger_rows, start=1):
        vendor = (row.get("供应商") or "").strip()
        fee_type = (row.get("费用类型") or "").strip()
        entity = (row.get("主体") or "").strip()
        currency = (row.get("交易币种") or row.get("币种") or ("CAD" if region_tag == "CAN" else "USD")).strip()
        source_rows = row.get("_source_rows", "1")
        amount_raw = (row.get("含税总额") or "").strip().replace(",", "")
        try:
            invoice_total = float(amount_raw)
        except ValueError:
            skipped.append({"vendor": vendor, "fee_type": fee_type, "reason": "金额无效"})
            continue

        rule = lookup_rule(vendor, fee_type, rule_exact, rule_vendor_only)
        basis_id = rule.get("basis_id") or "DEFAULT"
        if basis_id not in basis_cache:
            skipped.append({"vendor": vendor, "fee_type": fee_type, "reason": f"缺少分摊依据 {basis_id}"})
            continue

        dept_list = rule.get("departments") or []
        cc_list = rule.get("cost_centers") or []
        fkey = filter_cache_key(basis_id, dept_list, cc_list)
        if fkey not in filter_cache:
            filter_cache[fkey] = filter_headcount_rows(basis_cache[basis_id], dept_list, cc_list)
        hc_rows = filter_cache[fkey]
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

        out_name = output_filename(region_tag, vendor, fee_type, entity, period, ts, seq)
        out_path = output_dir / out_name
        write_allocation_csv(out_rows, out_path)
        outputs.append(str(out_path))
        dept_filter = ";".join(dept_list) or "—"
        results.append(
            {
                "vendor": vendor,
                "fee_type": fee_type,
                "entity": entity,
                "amount": f"{invoice_total:.2f}",
                "source_rows": source_rows,
                "basis_id": basis_id,
                "dept_filter": dept_filter,
                "output": str(out_path),
                "output_rows": len(out_rows),
            }
        )

    report_path = output_dir / f"批量分摊报告_{region_tag}_{period}_{ts}.md"
    report_path.write_text(build_report_md(period, country, results, skipped, stats), encoding="utf-8")
    summary_path = output_dir / f"批量分摊结果_{region_tag}_{period}_{ts}.json"
    summary_path.write_text(
        json.dumps(
            {
                "ok": True,
                "stats": stats,
                "results": results,
                "skipped": skipped,
                "outputs": outputs + [str(report_path)],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    outputs.extend([str(report_path), str(summary_path)])

    return {
        "ok": True,
        "period": period,
        "country": country,
        "stats": stats,
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
