#!/usr/bin/env python3
"""Export Weixin/Tencent docs to local archive folder.

Uses Playwright with a persistent browser profile so logged-in sessions work.
Run once after logging into doc.weixin.qq.com in the launched browser window.
"""

from __future__ import annotations

import argparse
import json
import re
import time
from pathlib import Path
from urllib.parse import urlparse, parse_qs

from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "01_参考资料" / "企业微信文档归档"
DOWNLOADS = ARCHIVE / "_downloads"
MANIFEST = ARCHIVE / "manifest.json"

# Seed docs from user request + linked doc discovered in browser
SEED_DOCS = [
    {
        "id": "hrssc_operation_issue_proposal",
        "title": "HRSSC Operation Issue & Proposal",
        "url": "https://doc.weixin.qq.com/doc/w3_AdAAHQbZAP8SGIXTMOSIaTouR7cfn?scode=AJEAIQdfAAoCEIm00y",
        "type": "doc",
    },
    {
        "id": "prepayroll_quality_log",
        "title": "Pre-Payroll Quality Improvement Log (PSSC+HRSSC meeting)",
        "url": "https://doc.weixin.qq.com/sheet/e3_AQwAOwZHAP4b6OX8D2bQV0d6N3N06?scode=AJEAIQdfAAode0xkV4",
        "type": "sheet",
    },
    {
        "id": "hrssc_benefits_payroll_2026",
        "title": "海外HRSSC福利&并薪运营梳理-2026",
        "url": "https://doc.weixin.qq.com/sheet/e3_ATgA9gYhADkCNDEQQVQaMQAuGzqbz?scode=AJEAIQdfAAoHZK3Lxd",
        "type": "sheet",
    },
    {
        "id": "hrssc_cb_request_tracking",
        "title": "HRSSC C&B Request Tracking Form",
        "url": "https://doc.weixin.qq.com/sheet/e3_ATgA9gYhADkCNUHhFCB4YSV0VdlIp?scode=AJEAIQdfAAo6sRfhUYATgA9gYhADk",
        "type": "sheet",
        "linked_from": "hrssc_benefits_payroll_2026",
    },
]


def slugify(name: str) -> str:
    s = re.sub(r"[^\w\u4e00-\u9fff\-]+", "_", name.strip())
    return re.sub(r"_+", "_", s).strip("_")[:80]


def doc_key(url: str) -> str:
    path = urlparse(url).path
    m = re.search(r"/(doc|sheet|slide|form|mind)/([^/?]+)", path)
    return m.group(2) if m else path


def extract_links_from_text(text: str) -> list[str]:
    return re.findall(r"https://doc\.weixin\.qq\.com/[^\s\)\]\"']+", text)


def extract_links_from_page(page) -> list[str]:
    hrefs = page.evaluate(
        """() => Array.from(document.querySelectorAll('[href], [data-url], [data-href]'))
            .map(el => el.href || el.getAttribute('data-url') || el.getAttribute('data-href'))
            .filter(Boolean)"""
    )
    links = [h for h in hrefs if isinstance(h, str) and "doc.weixin.qq.com" in h]
    body = page.inner_text("body")
    links.extend(extract_links_from_text(body))
    # dedupe preserve order
    seen = set()
    out = []
    for u in links:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def wait_loaded(page, doc_type: str, timeout_ms: int = 45_000) -> None:
    page.wait_for_load_state("domcontentloaded")
    try:
        if doc_type == "doc":
            page.wait_for_function(
                "() => document.body.innerText.length > 500 && !document.body.innerText.includes('企业微信扫码登录')",
                timeout=timeout_ms,
            )
        else:
            page.wait_for_function(
                "() => document.body.innerText.includes('开始') || document.querySelector('[role=tab]')",
                timeout=timeout_ms,
            )
    except PWTimeout:
        print("  ⚠ page load timeout; saving partial snapshot")
    time.sleep(1)


def export_via_menu(page, dest: Path, doc_type: str) -> Path | None:
    """Click 文档 menu -> 导出 and save download."""
    dest.parent.mkdir(parents=True, exist_ok=True)

    # Open file menu (top-left doc icon / 菜单)
    selectors = [
        '[aria-label="file"]',
        '[name="file"]',
        'text=Pre-Payroll',
    ]
    opened = False
    for sel in ['[aria-label="file"]', '[name="file"]']:
        try:
            loc = page.locator(sel).first
            if loc.count():
                loc.click(timeout=3000)
                opened = True
                break
        except PWTimeout:
            pass

    if not opened:
        # fallback: click near title area hamburger
        try:
            page.locator("text=导出").first.wait_for(state="visible", timeout=2000)
        except PWTimeout:
            page.mouse.click(36, 28)
            time.sleep(0.8)

    export_item = page.get_by_role("menuitem", name="导出")
    if export_item.count() == 0:
        export_item = page.locator("text=导出").first
    export_item.click(timeout=8000)
    time.sleep(0.5)

    # Submenu: Excel / Word / PDF
    if doc_type == "sheet":
        for label in ["本地 Excel 表格", "Excel", "xlsx", ".xlsx"]:
            loc = page.locator(f"text={label}")
            if loc.count():
                with page.expect_download(timeout=120_000) as dl_info:
                    loc.first.click()
                download = dl_info.value
                target = dest.with_suffix(".xlsx")
                download.save_as(target)
                return target
    else:
        for label in ["本地 Word 文档", "Word", "docx", ".docx", "本地文档"]:
            loc = page.locator(f"text={label}")
            if loc.count():
                with page.expect_download(timeout=120_000) as dl_info:
                    loc.first.click()
                download = dl_info.value
                target = dest.with_suffix(".docx")
                download.save_as(target)
                return target

    return None


def save_text_snapshot(page, dest: Path) -> None:
    text = page.inner_text("body")
    dest.write_text(text, encoding="utf-8")


def process_doc(page, entry: dict, manifest: dict) -> dict:
    url = entry["url"]
    key = doc_key(url)
    slug = entry.get("id") or slugify(entry.get("title", key))
    base = ARCHIVE / slug
    base.mkdir(parents=True, exist_ok=True)

    print(f"\n→ {entry.get('title', slug)}\n  {url}")
    page.goto(url, wait_until="domcontentloaded", timeout=120_000)
    wait_loaded(page, entry.get("type", "sheet"))

    record = {
        **entry,
        "doc_key": key,
        "archived_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "files": [],
        "linked_urls": [],
    }

    # Text snapshot (always)
    txt_path = base / f"{slug}.txt"
    save_text_snapshot(page, txt_path)
    record["files"].append(str(txt_path.relative_to(ROOT)))

    # Try export
    dl_base = DOWNLOADS / slug
    exported = export_via_menu(page, dl_base, entry.get("type", "sheet"))
    if exported:
        record["files"].append(str(exported.relative_to(ROOT)))
        print(f"  ✓ exported {exported.name}")
    else:
        print("  ⚠ export menu failed; kept text snapshot only")

    # Collect links for crawl
    links = extract_links_from_page(page)
    record["linked_urls"] = links
    print(f"  found {len(links)} weixin links on page")

    manifest["documents"][key] = record
    return record


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--profile", default=str(Path.home() / ".cache" / "weixin-doc-export-profile"))
    parser.add_argument("--headless", action="store_true")
    parser.add_argument("--max-depth", type=int, default=2)
    args = parser.parse_args()

    ARCHIVE.mkdir(parents=True, exist_ok=True)
    DOWNLOADS.mkdir(parents=True, exist_ok=True)

    manifest = {
        "source": "doc.weixin.qq.com",
        "archived_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "documents": {},
        "pending": [],
    }

    queue = list(SEED_DOCS)
    seen_urls = set()

    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir=args.profile,
            headless=args.headless,
            accept_downloads=True,
            viewport={"width": 1600, "height": 1000},
        )
        page = context.pages[0] if context.pages else context.new_page()

        depth = 0
        while queue and depth <= args.max_depth:
            batch = queue
            queue = []
            for entry in batch:
                url = entry["url"]
                if url in seen_urls:
                    continue
                seen_urls.add(url)

                try:
                    record = process_doc(page, entry, manifest)
                except Exception as exc:
                    print(f"  ✗ failed: {exc}")
                    manifest["pending"].append({"url": url, "error": str(exc)})
                    continue

                for link in record.get("linked_urls", []):
                    lk = doc_key(link)
                    if lk not in manifest["documents"] and link not in seen_urls:
                        queue.append(
                            {
                                "id": slugify(lk),
                                "title": lk,
                                "url": link,
                                "type": "sheet" if "/sheet/" in link else "doc",
                                "linked_from": entry.get("id"),
                            }
                        )
            depth += 1

        context.close()

    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    readme = ARCHIVE / "README.md"
    lines = [
        "# 企业微信文档归档",
        "",
        f"归档时间：{manifest['archived_at']}",
        "",
        "## 文档清单",
        "",
        "| 标题 | 类型 | 源链接 | 本地文件 |",
        "|------|------|--------|----------|",
    ]
    for rec in manifest["documents"].values():
        files = ", ".join(f"`{f}`" for f in rec.get("files", []))
        lines.append(
            f"| {rec.get('title', rec.get('doc_key'))} | {rec.get('type')} | [打开]({rec['url']}) | {files} |"
        )
    if manifest["pending"]:
        lines.extend(["", "## 未完成", ""])
        for p in manifest["pending"]:
            lines.append(f"- {p['url']}: {p['error']}")
    readme.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"\nDone. Manifest: {MANIFEST}")


if __name__ == "__main__":
    main()
