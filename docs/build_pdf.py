#!/usr/bin/env python3
"""Generate PDF from markdown (Chinese) using fpdf2."""
from __future__ import annotations

import re
import textwrap
from pathlib import Path

from fpdf import FPDF

MD = Path(__file__).resolve().parent / "AMER_FPP_AI工作台与组织建设说明.md"
PDF = Path(__file__).resolve().parent / "AMER_FPP_AI工作台与组织建设说明.pdf"

FONTS = [
    "/Library/Fonts/Arial Unicode.ttf",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
]


class DocPDF(FPDF):
    def __init__(self) -> None:
        super().__init__()
        self.set_margins(18, 18, 18)
        self.set_auto_page_break(auto=True, margin=18)

    def footer(self) -> None:
        self.set_y(-12)
        self.set_font("zh", size=8)
        self.set_text_color(130, 130, 130)
        self.cell(0, 8, f"AMER FPP + ai  ·  第 {self.page_no()} 页", align="C")


def wrap(text: str, width: int = 46) -> list[str]:
    text = text.strip()
    if not text:
        return []
    parts: list[str] = []
    for para in re.split(r"\s{2,}|\n", text):
        if len(para) <= width:
            parts.append(para)
        else:
            parts.extend(textwrap.wrap(para, width=width, break_long_words=True, break_on_hyphens=False))
    return parts or [text]


def build() -> None:
    pdf = DocPDF()
    font_path = next((p for p in FONTS if Path(p).exists()), None)
    if not font_path:
        raise SystemExit("未找到中文字体")
    pdf.add_font("zh", "", font_path)
    pdf.add_page()
    pdf.set_font("zh", size=10)

    lines = MD.read_text(encoding="utf-8").splitlines()
    in_code = False
    code: list[str] = []

    def emit(text: str, size: int = 10, gap: float = 5) -> None:
        pdf.set_x(pdf.l_margin)
        pdf.set_font("zh", size=size)
        for ln in wrap(text, 44 if size >= 10 else 52):
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(pdf.epw, gap, ln)
        pdf.set_font("zh", size=10)

    for raw in lines:
        line = raw.rstrip()
        if line.strip().startswith("```"):
            if in_code:
                pdf.set_fill_color(245, 245, 245)
                pdf.set_font("zh", size=8)
                for cl in code:
                    for wl in wrap(cl, 58):
                        pdf.set_x(pdf.l_margin)
                        pdf.multi_cell(pdf.epw, 4.5, wl, fill=True)
                pdf.ln(2)
                pdf.set_font("zh", size=10)
                code = []
                in_code = False
            else:
                in_code = True
            continue
        if in_code:
            code.append(line)
            continue

        s = line.strip()
        if not s or re.match(r"^\|\s*[-:| ]+\|\s*$", s):
            continue
        if s == "---":
            pdf.ln(2)
            continue
        if s.startswith("# "):
            pdf.ln(4)
            emit(s[2:], 16, 8)
            continue
        if s.startswith("## "):
            pdf.ln(3)
            emit(s[3:], 13, 7)
            continue
        if s.startswith("### "):
            pdf.ln(2)
            emit(s[4:], 11, 6)
            continue
        if s.startswith("|"):
            cells = [c.strip() for c in s.strip("|").split("|")]
            emit("  |  ".join(cells), 9, 4.5)
            continue
        if s.startswith("- ") or s.startswith("* "):
            emit("• " + s[2:])
            continue
        if s.startswith(">"):
            pdf.set_text_color(70, 70, 70)
            emit(s.lstrip("> ").strip(), 9, 4.5)
            pdf.set_text_color(0, 0, 0)
            continue
        s = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", s)
        s = re.sub(r"\*\*([^*]+)\*\*", r"\1", s)
        s = re.sub(r"`([^`]+)`", r"\1", s)
        emit(s)

    pdf.output(str(PDF))
    print(f"DONE: {PDF} ({PDF.stat().st_size} bytes)")


if __name__ == "__main__":
    build()
