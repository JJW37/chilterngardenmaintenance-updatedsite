#!/usr/bin/env python3
"""Prepare a static CGM build for GitHub Pages project-site hosting."""

from __future__ import annotations

import argparse
import re
from pathlib import Path


DEFAULT_BASE = "/chilterngardenmaintenance-updatedsite"
TEXT_SUFFIXES = {".html", ".htm", ".css", ".js", ".json", ".xml", ".txt"}
SITE_SEGMENTS = (
    "css", "js", "images", "images-ppt", "services", "portfolio", "tips",
    "plants", "calculators", "guides", "locations", "about", "booking",
    "contact", "products", "garden-passport", "functions", "maps", "project",
    "_private-data", "cookies.html", "privacy.html", "terms.html", "sitemap.xml",
    "robots.txt", "404.html",
)
SEGMENT_PATTERN = "|".join(re.escape(segment) for segment in SITE_SEGMENTS)
KNOWN_URL = re.compile(
    rf"(?P<quote>[\"'`])(?P<path>/(?:{SEGMENT_PATTERN})(?:[/?.#][^\"'`\s]*)?)"
)
ATTRIBUTE_URL = re.compile(
    r"(?P<attribute>\b(?:href|src|action|poster|data-src|data-href)\s*=\s*)"
    r"(?P<quote>[\"'])(?P<path>/(?!/)[^\"']*)",
    re.IGNORECASE,
)


def prefix_known_urls(text: str, base: str) -> str:
    def replace_known(match: re.Match[str]) -> str:
        quote = match.group("quote")
        path = match.group("path")
        if path == base or path.startswith(base + "/"):
            return quote + path
        return quote + base + path

    def replace_attribute(match: re.Match[str]) -> str:
        path = match.group("path")
        if path == base or path.startswith(base + "/"):
            return match.group(0)
        return match.group("attribute") + match.group("quote") + base + path

    text = ATTRIBUTE_URL.sub(replace_attribute, text)
    return KNOWN_URL.sub(replace_known, text)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path("."))
    parser.add_argument("--base", default=DEFAULT_BASE)
    args = parser.parse_args()
    base = "/" + args.base.strip("/") if args.base.strip("/") else ""
    changed = 0
    for path in sorted(args.root.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        if path.resolve() == Path(__file__).resolve():
            continue
        original = path.read_text(encoding="utf-8")
        updated = prefix_known_urls(original, base)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            changed += 1
    print(f"Prefixed URLs in {changed} files for {base or '/'}")


if __name__ == "__main__":
    main()
