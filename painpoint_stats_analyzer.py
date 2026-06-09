#!/usr/bin/env python3
"""Statistical efficiency analyzer for FPP workflow."""

from __future__ import annotations

import argparse
import csv
import json
import math
import statistics
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional


REQUIRED_FIELDS = ["期间", "国家", "主体", "供应商", "费用类型", "交易币种", "支付币种", "Invoice策略"]
OK_VALUES = {"ok", "pass", "yes", "y"}


@dataclass
class RowRisk:
    row_no: int
    period: str
    vendor: str
    country: str
    score: int
    reasons: list[str]


def parse_number(text: str) -> Optional[float]:
    txt = (text or "").strip().replace(",", "")
    if not txt:
        return None
    try:
        return float(txt)
    except ValueError:
        return None


def percentile(values: list[float], pct: float) -> float:
    if not values:
        return 0.0
    if len(values) == 1:
        return values[0]
    k = (len(values) - 1) * pct
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return values[int(k)]
    d0 = values[f] * (c - k)
    d1 = values[c] * (k - f)
    return d0 + d1


def detect_amount_outliers(rows: list[dict[str, str]]) -> list[str]:
    samples: list[tuple[int, str, float]] = []
    for idx, row in enumerate(rows, start=2):
        amount = parse_number(row.get("含税总额", ""))
        vendor = (row.get("供应商") or "").strip() or "UNKNOWN"
        if amount is not None:
            samples.append((idx, vendor, amount))
    if len(samples) < 4:
        return ["样本不足，跳过金额异常检测（至少4行有效金额）。"]

    values = sorted(v for _, _, v in samples)
    q1 = percentile(values, 0.25)
    q3 = percentile(values, 0.75)
    iqr = q3 - q1
    low = q1 - 1.5 * iqr
    high = q3 + 1.5 * iqr
    mean = statistics.mean(values)
    stdev = statistics.pstdev(values)
    out: list[str] = []

    for row_no, vendor, amount in samples:
        z = 0.0 if stdev == 0 else (amount - mean) / stdev
        if amount < low or amount > high or abs(z) >= 2.8:
            out.append(f"L{row_no} {vendor} 含税总额={amount:.2f}（IQR或Z-Score异常，z={z:.2f}）")
    return out or ["未发现明显金额异常。"]


def stability_monitor(rows: list[dict[str, str]]) -> list[str]:
    monthly_vendor_sum: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    for row in rows:
        period = (row.get("期间") or "").strip()
        vendor = (row.get("供应商") or "").strip() or "UNKNOWN"
        amount = parse_number(row.get("含税总额", ""))
        if period and amount is not None:
            monthly_vendor_sum[vendor][period] += amount

    alerts: list[str] = []
    for vendor, period_map in monthly_vendor_sum.items():
        if len(period_map) < 3:
            continue
        periods = sorted(period_map.keys())
        latest = periods[-1]
        history_vals = [period_map[p] for p in periods[:-1]]
        mu = statistics.mean(history_vals)
        sigma = statistics.pstdev(history_vals) or 1.0
        cur = period_map[latest]
        z = (cur - mu) / sigma
        if abs(z) >= 2.0:
            alerts.append(f"{vendor} {latest} 金额波动超阈值（z={z:.2f}, 当前={cur:.2f}, 历史均值={mu:.2f}）")
    return alerts or ["供应商月度波动未超过阈值。"]


def risk_scoring(rows: list[dict[str, str]]) -> list[RowRisk]:
    scored: list[RowRisk] = []
    for idx, row in enumerate(rows, start=2):
        reasons: list[str] = []
        score = 0
        for f in REQUIRED_FIELDS:
            if not (row.get(f) or "").strip():
                score += 8
                reasons.append(f"缺少字段:{f}")
        ccy1 = (row.get("交易币种") or "").strip().upper()
        ccy2 = (row.get("支付币种") or "").strip().upper()
        if ccy1 and ccy2 and ccy1 != ccy2:
            score += 18
            reasons.append("币种不一致")
        submit_flag = (row.get("可提交(Y/N)") or "").strip().upper()
        if submit_flag == "N":
            score += 20
            reasons.append("可提交=N")
        for sf in ["成本中心校验状态", "期间一致性状态", "金额校验状态"]:
            val = (row.get(sf) or "").strip().lower()
            if val and val not in OK_VALUES:
                score += 12
                reasons.append(f"{sf}未通过")
        amount = parse_number(row.get("含税总额", ""))
        if amount is None:
            score += 8
            reasons.append("含税总额非数字")

        scored.append(
            RowRisk(
                row_no=idx,
                period=(row.get("期间") or "").strip(),
                vendor=(row.get("供应商") or "").strip(),
                country=(row.get("国家") or "").strip(),
                score=score,
                reasons=reasons,
            )
        )
    return sorted(scored, key=lambda x: x.score, reverse=True)


def load_jobs(path: Path) -> list[dict]:
    if not path.exists():
        return []
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []


def step_timing(jobs: list[dict]) -> list[str]:
    by_step: dict[str, list[int]] = defaultdict(list)
    for j in jobs:
        step = str(j.get("step", "")).strip() or "unknown"
        ms = j.get("elapsed_ms")
        if isinstance(ms, int):
            by_step[step].append(ms)
    lines: list[str] = []
    for step, vals in sorted(by_step.items()):
        vals_sorted = sorted(vals)
        p90 = percentile([float(v) for v in vals_sorted], 0.9)
        lines.append(
            f"{step}: count={len(vals_sorted)}, avg={statistics.mean(vals_sorted):.0f}ms, p90={p90:.0f}ms, max={max(vals_sorted)}ms"
        )
    return lines or ["无任务耗时数据。"]


def classify_failure(job: dict) -> str:
    text = " ".join([*(job.get("stderr_tail") or []), *(job.get("stdout_tail") or [])]).lower()
    if "missing" in text or "field" in text or "缺少" in text:
        return "字段问题"
    if "not found" in text or "file" in text or "路径" in text:
        return "文件问题"
    return "服务问题"


def pareto_failures(jobs: list[dict]) -> list[str]:
    failures = [j for j in jobs if not j.get("ok", True)]
    if not failures:
        return ["无失败任务记录。"]
    counter = Counter(classify_failure(j) for j in failures)
    total = sum(counter.values())
    lines: list[str] = []
    running = 0
    for k, v in counter.most_common():
        running += v
        lines.append(f"{k}: {v} 次，占比 {v * 100 / total:.1f}%，累计 {running * 100 / total:.1f}%")
    return lines


def write_risk_csv(path: Path, risks: list[RowRisk]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["row_no", "period", "country", "vendor", "risk_score", "reasons"])
        for r in risks:
            writer.writerow([r.row_no, r.period, r.country, r.vendor, r.score, " | ".join(r.reasons)])


def main() -> int:
    parser = argparse.ArgumentParser(description="Run statistical efficiency analysis")
    parser.add_argument("--prefill", required=True, help="Submission prefill CSV")
    parser.add_argument("--jobs", default="./bot-gateway/jobs.json", help="Jobs JSON path")
    parser.add_argument("--report", default="./上传输出/统计提效分析报告.md", help="Markdown report path")
    parser.add_argument("--risk-csv", default="./上传输出/统计提效_风险评分明细.csv", help="Risk CSV path")
    parser.add_argument("--summary-json", default="./上传输出/统计提效_看板摘要.json", help="Dashboard summary JSON path")
    args = parser.parse_args()

    prefill = Path(args.prefill).resolve()
    jobs_path = Path(args.jobs).resolve()
    report_path = Path(args.report).resolve()
    risk_csv_path = Path(args.risk_csv).resolve()
    summary_json_path = Path(args.summary_json).resolve()

    if not prefill.exists():
        print(f"输入文件不存在: {prefill}")
        return 2

    with prefill.open("r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    periods = sorted({(r.get("期间") or "").strip() for r in rows if (r.get("期间") or "").strip()})
    countries = [((r.get("国家") or "").strip() or "UNKNOWN") for r in rows]
    country_breakdown: dict[str, int] = dict(Counter(countries))
    coverage_types = {
        f"{(r.get('供应商') or '').strip()}|{(r.get('费用类型') or '').strip()}"
        for r in rows
        if (r.get("供应商") or "").strip() or (r.get("费用类型") or "").strip()
    }

    jobs = load_jobs(jobs_path)
    outliers = detect_amount_outliers(rows)
    stability = stability_monitor(rows)
    risks = risk_scoring(rows)
    timing = step_timing(jobs)
    pareto = pareto_failures(jobs)

    report_lines: list[str] = []
    report_lines.append("# 统计提效分析报告")
    report_lines.append("")
    report_lines.append(f"- 输入：`{prefill}`")
    report_lines.append(f"- 任务日志：`{jobs_path}`")
    report_lines.append(f"- 样本行数：`{len(rows)}`")
    report_lines.append("")
    report_lines.append("## 1) 异常检测（金额Z-Score/IQR）")
    report_lines.extend([f"- {x}" for x in outliers])
    report_lines.append("")
    report_lines.append("## 2) 稳定性监控（供应商月度波动）")
    report_lines.extend([f"- {x}" for x in stability])
    report_lines.append("")
    report_lines.append("## 3) 规则评分（高风险优先）")
    top = risks[:10]
    for r in top:
        report_lines.append(f"- L{r.row_no} {r.vendor or 'UNKNOWN'} score={r.score} | {'; '.join(r.reasons) if r.reasons else '无'}")
    report_lines.append("")
    report_lines.append("## 4) 处理时效分析（步骤耗时）")
    report_lines.extend([f"- {x}" for x in timing])
    report_lines.append("")
    report_lines.append("## 5) 失败归因看板（Pareto）")
    report_lines.extend([f"- {x}" for x in pareto])
    report_lines.append("")

    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text("\n".join(report_lines), encoding="utf-8")
    write_risk_csv(risk_csv_path, risks)
    risk_hi = sum(1 for r in risks if r.score >= 40)
    risk_mid = sum(1 for r in risks if 20 <= r.score < 40)
    risk_low = sum(1 for r in risks if r.score < 20)
    summary = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "periods": periods,
        "country_breakdown": country_breakdown,
        "rows": len(rows),
        "coverage_type_count": len(coverage_types),
        "coverage_types": sorted(coverage_types),
        "amount_outlier_count": 0 if outliers and "未发现" in outliers[0] else len([x for x in outliers if x.startswith("L")]),
        "stability_alert_count": 0 if stability and "未超过阈值" in stability[0] else len(stability),
        "risk_high": risk_hi,
        "risk_mid": risk_mid,
        "risk_low": risk_low,
        "top_risks": [
            {"row_no": r.row_no, "vendor": r.vendor, "score": r.score, "reasons": r.reasons[:3]}
            for r in risks[:5]
        ],
        "step_timing": timing,
        "failure_pareto": pareto,
    }
    summary_json_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"DONE: {report_path}")
    print(f"DONE: {risk_csv_path}")
    print(f"DONE: {summary_json_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
