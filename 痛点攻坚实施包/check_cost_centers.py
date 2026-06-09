#!/usr/bin/env python3
"""Pain point #3: validate cost center status before submission."""

from __future__ import annotations

import argparse
import csv
from datetime import datetime
from pathlib import Path


def load_status_map(path: Path) -> dict[str, str]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    status = {}
    for r in rows:
        code = (r.get("成本中心") or "").strip()
        st = (r.get("状态") or "").strip()
        if code:
            status[code] = st or "未知"
    return status


def load_centers_from_file(path: Path) -> set[str]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    centers = set()
    for r in rows:
        for key in ("成本中心", "Center"):
            code = (r.get(key) or "").strip()
            if code:
                centers.add(code)
    return centers


def main() -> int:
    parser = argparse.ArgumentParser(description="Check cost center active/inactive status")
    parser.add_argument("--source", required=True, help="CSV with 成本中心/Center column")
    parser.add_argument("--status", required=True, help="成本中心状态表 CSV")
    parser.add_argument("--output", required=True, help="Output markdown report path")
    args = parser.parse_args()

    src = Path(args.source).resolve()
    status_file = Path(args.status).resolve()
    out = Path(args.output).resolve()
    if not src.exists() or not status_file.exists():
        print("Missing source or status file")
        return 2

    status_map = load_status_map(status_file)
    centers = sorted(load_centers_from_file(src))
    inactive = []
    unknown = []
    active = []

    for c in centers:
        st = status_map.get(c, "未维护")
        low = st.lower()
        if st == "未维护":
            unknown.append((c, st))
        elif any(k in low for k in ("失效", "inactive", "停用")):
            inactive.append((c, st))
        else:
            active.append((c, st))

    lines = [
        "# 成本中心有效性检查报告",
        "",
        f"- 检查时间：`{datetime.now().isoformat(timespec='seconds')}`",
        f"- 源文件：`{src}`",
        f"- 状态表：`{status_file}`",
        f"- 总成本中心数：`{len(centers)}`",
        f"- 可用：`{len(active)}`",
        f"- 失效：`{len(inactive)}`",
        f"- 未维护：`{len(unknown)}`",
        "",
        "## 失效成本中心（阻断）",
        "",
    ]
    if inactive:
        for i, (c, st) in enumerate(inactive, 1):
            lines.append(f"- [ ] {i}. `{c}` 状态=`{st}`")
    else:
        lines.append("- 无")
    lines.extend(["", "## 未维护成本中心（需人工确认）", ""])
    if unknown:
        for i, (c, st) in enumerate(unknown, 1):
            lines.append(f"- [ ] {i}. `{c}` 状态=`{st}`")
    else:
        lines.append("- 无")
    lines.extend(
        [
            "",
            "## 建议动作",
            "",
            "- [ ] 先修复失效中心（替代映射或主数据修复）",
            "- [ ] 补齐未维护中心状态",
            "- [ ] 修复后重新执行本检查",
        ]
    )
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"Generated: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
