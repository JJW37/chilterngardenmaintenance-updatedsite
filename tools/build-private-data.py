#!/usr/bin/env python3
"""Build the small JSON payloads used by the client-side plant finder."""

from __future__ import annotations

import html
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "_private-data"


def clean(fragment: str) -> str:
    fragment = re.sub(r"<[^>]+>", " ", fragment)
    return re.sub(r"\s+", " ", html.unescape(fragment)).strip()


def first(pattern: str, text: str, default: str = "") -> str:
    match = re.search(pattern, text, re.I | re.S)
    return clean(match.group(1)) if match else default


def plant_record(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    name = first(r"<h1[^>]*>(.*?)</h1>", text, path.stem.replace("-", " ").title())
    scientific = first(r'<div class="plant-latin"[^>]*>(.*?)</div>', text)
    tags = [clean(x) for x in re.findall(r'<span class="tag"[^>]*>(.*?)</span>', text, re.I | re.S)]
    facts = {}
    for label, value in re.findall(
        r'<div class="fact"><dt>.*?</svg>\s*(.*?)</dt><dd>(.*?)</dd></div>',
        text,
        re.I | re.S,
    ):
        facts[clean(label).lower()] = clean(value)

    full = clean(text).lower()
    light_text = facts.get("light", "").lower()
    lights = []
    if "full sun" in light_text or "sunny" in light_text:
        lights.append("full-sun")
    if "partial shade" in light_text or "dappled shade" in light_text:
        lights.append("partial-shade")
    if "full shade" in light_text or ("shade" in light_text and not lights):
        lights.append("full-shade")

    drainage_text = facts.get("drainage", "").lower()
    if re.search(r"free[- ]draining|excellent drainage|sharp drainage|well drained", drainage_text):
        drainage = ["fast"]
    elif re.search(r"waterlog|poor drainage|heavy clay|moisture-retentive|moist soil", drainage_text):
        drainage = ["slow"]
    else:
        drainage = ["moderate"]

    soil_text = facts.get("soil type", "").lower()
    if "will not grow on chalk" in soil_text or "dislikes chalk" in soil_text:
        chalk = "low"
    elif "chalk" in soil_text or "chalk" in full:
        chalk = "high"
    else:
        chalk = "unknown"

    if re.search(r"non-toxic|non toxic|safe for pets|safe around pets", full):
        toxicity = "none"
    elif re.search(r"highly toxic|very poisonous", full):
        toxicity = "high"
    elif re.search(r"toxic|poisonous", full):
        toxicity = "moderate"
    else:
        toxicity = "unknown"

    extra_tags = list(tags)
    for keyword in ("pollinator", "bee", "butterfly", "wildlife"):
        if keyword in full and keyword not in extra_tags:
            extra_tags.append(keyword)

    return {
        "slug": path.stem,
        "name": name,
        "scientificName": scientific,
        "plantType": tags[0] if tags else "Plant",
        "tags": extra_tags,
        "growingConditions": {"light": lights, "drainage": drainage, "chalkTolerance": chalk},
        "matureSize": {"sourceText": facts.get("mature size", "")},
        "safety": {"toxicity": toxicity},
    }


def town_records() -> list[dict]:
    map_text = (ROOT / "js" / "map-data.js").read_text(encoding="utf-8")
    payload = map_text.split("window.CGM_MAP_DATA =", 1)[1].rsplit(";", 1)[0].strip()
    map_data = json.loads(payload)
    page_records = {}
    for path in sorted((ROOT / "locations").glob("*.html")):
        if path.stem == "index":
            continue
        text = path.read_text(encoding="utf-8")
        soil = first(r'<div class="quick-fact"><dt>.*?</svg>\s*Average soil type</dt><dd>(.*?)</dd>', text).lower()
        ph_text = first(r'<div class="quick-fact"><dt>.*?</svg>\s*Average soil pH</dt><dd>(.*?)</dd>', text).lower()
        rainfall_text = first(r'<div class="quick-fact"><dt>.*?</svg>\s*Average rainfall</dt><dd>(.*?)</dd>', text).lower()
        if "chalk" in soil:
            texture = "chalk"
        elif "clay" in soil:
            texture = "clay"
        elif "sand" in soil:
            texture = "sand"
        else:
            texture = "loam"
        if re.search(r"free[- ]drain|drain quickly|well drain", soil + " " + text.lower()):
            drainage = "fast"
        elif re.search(r"poor drain|waterlog|heavy clay", soil + " " + text.lower()):
            drainage = "slow"
        else:
            drainage = "moderate"
        rainfall = int(re.search(r"(\d{3,4})\s*mm", rainfall_text).group(1)) if re.search(r"(\d{3,4})\s*mm", rainfall_text) else 700
        ph_match = re.search(r"(\d(?:\.\d)?)\s*(?:to|-)[ ]*(\d(?:\.\d)?)", ph_text)
        ph = {"min": float(ph_match.group(1)), "max": float(ph_match.group(2))} if ph_match else {}
        page_records[path.stem] = {
            "soil": {"primaryTexture": texture, "secondaryTextures": ["chalk"] if "chalk" in soil else [], "ph": ph},
            "climate": {"drainage": drainage, "frostRisk": "moderate", "rainfall": {"annualMm": rainfall}},
        }

    records = []
    for town in map_data.get("towns", []):
        record = dict(town)
        record["coordinates"] = {"latitude": town.get("lat"), "longitude": town.get("lng")}
        record.update(page_records.get(town.get("slug"), {}))
        records.append(record)
    return records


def main() -> None:
    OUT.mkdir(exist_ok=True)
    plants = [plant_record(path) for path in sorted((ROOT / "plants").glob("*.html")) if path.stem != "index"]
    (OUT / "plants.json").write_text(json.dumps(plants, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    towns = town_records()
    (OUT / "towns.json").write_text(json.dumps(towns, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Built {len(plants)} plant records and {len(towns)} town records")


if __name__ == "__main__":
    main()
