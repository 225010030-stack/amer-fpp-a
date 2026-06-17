#!/usr/bin/env python3
"""Convert invoice PDF first page to PNG (for Knot 对话测试或手工核对)."""

from __future__ import annotations

import argparse
from pathlib import Path

from invoice_extract import pdf_first_page_to_png


def main() -> None:
    ap = argparse.ArgumentParser(description="Invoice PDF → PNG（首页或含 Amount Due 的页）")
    ap.add_argument("pdf", type=Path, help="输入 PDF 路径")
    ap.add_argument("-o", "--output", type=Path, help="输出 PNG（默认与 PDF 同目录同名 .png）")
    args = ap.parse_args()
    pdf = args.pdf.expanduser().resolve()
    if not pdf.is_file():
        raise SystemExit(f"文件不存在: {pdf}")
    png_bytes, _ = pdf_first_page_to_png(pdf)
    out = args.output or pdf.with_suffix(".png")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(png_bytes)
    print(out)


if __name__ == "__main__":
    main()
