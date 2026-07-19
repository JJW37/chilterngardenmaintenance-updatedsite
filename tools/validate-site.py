#!/usr/bin/env python3
"""Small offline check for local links and assets in the GitHub Pages build."""

from pathlib import Path
import re
import sys
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
BASE = "/chilterngardenmaintenance-updatedsite"
TEXT_TYPES = {".html", ".htm", ".css", ".js", ".json", ".xml"}
ATTR = re.compile(r"(?:href|src|action|poster|data-src|data-href)\s*=\s*['\"]([^'\"]+)", re.I)
QUOTED_LOCAL = re.compile(r"['\"](/chilterngardenmaintenance-updatedsite/[^'\"\s)]+)")
CSS_URL = re.compile(r"url\(\s*['\"]?([^'\")\s]+)", re.I)


def is_local(value: str) -> bool:
    return value.startswith(BASE + "/") or value == BASE


def target_exists(value: str) -> bool:
    parsed = urlsplit(value)
    path = parsed.path
    if path == BASE:
        path = BASE + "/"
    if not is_local(path):
        return True
    relative = path[len(BASE):].lstrip("/")
    candidate = ROOT / relative
    return candidate.is_file() or (candidate.is_dir() and (candidate / "index.html").is_file())


def main() -> int:
    refs = 0
    missing: list[tuple[Path, str]] = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_TYPES:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        found = set(ATTR.findall(text)) | set(CSS_URL.findall(text)) | set(QUOTED_LOCAL.findall(text))
        for value in found:
            if value.startswith(("#", "mailto:", "tel:", "javascript:", "data:", "http:", "https:")):
                continue
            if is_local(value):
                refs += 1
                if not target_exists(value):
                    missing.append((path.relative_to(ROOT), value))
    print(f"Checked {refs} local project-site references")
    if missing:
        for path, value in missing[:40]:
            print(f"MISSING {path}: {value}")
        print(f"Missing references: {len(missing)}")
        return 1
    print("Missing references: 0")
    return 0


if __name__ == "__main__":
    sys.exit(main())
