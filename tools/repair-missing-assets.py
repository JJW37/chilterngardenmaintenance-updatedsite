#!/usr/bin/env python3
"""Repair references to assets omitted from the supplied static build."""

from pathlib import Path
import re


BASE = "/chilterngardenmaintenance-updatedsite"
ROOT = Path(__file__).resolve().parents[1]


def replace_in_text(old: str, new: str) -> int:
    count = 0
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in {".html", ".js", ".css"}:
            continue
        text = path.read_text(encoding="utf-8")
        updated = text.replace(old, new)
        if updated != text:
            path.write_text(updated, encoding="utf-8")
            count += text.count(old)
    return count


def replace_pattern(pattern: str, new: str) -> int:
    count = 0
    compiled = re.compile(pattern)
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in {".html", ".js", ".css"}:
            continue
        text = path.read_text(encoding="utf-8")
        updated, matches = compiled.subn(new, text)
        if updated != text:
            path.write_text(updated, encoding="utf-8")
            count += matches
    return count


def main() -> None:
    placeholder = f"{BASE}/images/plant-header.jpg"
    plant_images = replace_pattern(
        re.escape(f"{BASE}/images-ppt/") + r"[^\"'\s<]+",
        placeholder,
    )

    location_images = 0
    for slug in ("carterton", "old-windsor", "woodstock", "wraysbury"):
        location_images += replace_in_text(
            f"{BASE}/images/locations/towns/{slug}.webp",
            f"{BASE}/images/locations/towns/default-chilterns.webp",
        )

    bad_lawn_link = f"{BASE}/tips/lawn-care-and-lawn-repair.html"
    lawn_link = f"{BASE}/tips/returf-or-reseed-lawn.html"
    lawn_links = replace_in_text(bad_lawn_link, lawn_link)

    print(f"Replaced {plant_images} omitted plant-image references")
    print(f"Replaced {location_images} omitted location-image references")
    print(f"Repaired {lawn_links} broken lawn-guide references")


if __name__ == "__main__":
    main()
