#!/usr/bin/env python3
"""Build web/data/spells.json from the scraped spells_with_classes.json."""

from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "spells_with_classes.json"
OUT = Path(__file__).resolve().parents[1] / "data" / "spells.json"


def main() -> None:
    spells = json.loads(SRC.read_text())
    slim = []
    for spell in spells:
        query = parse_qs(urlparse(spell["url"]).query)
        item = unquote(query.get("ItemName", [""])[0]).strip()
        if not item:
            raise SystemExit(f"missing ItemName for {spell.get('name')}")

        mythic = spell.get("mythic_version")
        if isinstance(mythic, dict):
            mythic_version = {
                "name": mythic.get("name") or "",
                "source": mythic.get("source"),
                "description_text": mythic.get("description_text") or "",
            }
        else:
            mythic_version = None

        slim.append(
            {
                "id": item,
                "name": spell.get("name"),
                "url": spell.get("url"),
                "school": spell.get("school"),
                "subschool": spell.get("subschool"),
                "descriptor": spell.get("descriptor"),
                "level": spell.get("level"),
                "casting_time": spell.get("casting_time"),
                "components": spell.get("components"),
                "range": spell.get("range"),
                "area": spell.get("area"),
                "target": spell.get("target"),
                "effect": spell.get("effect"),
                "duration": spell.get("duration"),
                "saving_throw": spell.get("saving_throw"),
                "spell_resistance": spell.get("spell_resistance"),
                "source": spell.get("source"),
                "short_description": spell.get("short_description") or None,
                "description": spell.get("description_text") or "",
                "mythic": bool(spell.get("mythic")),
                "mythic_version": mythic_version,
                "flags": spell.get("flags") or [],
                "classes": spell.get("classes") or {},
            }
        )

    ids = [spell["id"] for spell in slim]
    if len(ids) != len(set(ids)):
        raise SystemExit("duplicate spell ids")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(slim, separators=(",", ":")))
    print(f"wrote {len(slim)} spells -> {OUT} ({OUT.stat().st_size / 1024 / 1024:.2f} MB)")


if __name__ == "__main__":
    main()
