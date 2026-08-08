#!/usr/bin/env python3
"""Fetch AoN spell-list short descriptions and merge into spells_with_classes.json."""

from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent
SPELLS_FILE = ROOT / "spells_with_classes.json"
SPELL_LIST_URL = "https://www.aonprd.com/Spells.aspx?Class=All"

SESSION = requests.Session()
SESSION.headers.update(
    {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }
)


def item_name_from_href(href: str) -> str | None:
    raw = href if "://" in href else f"https://www.aonprd.com/{href.lstrip('/')}"
    query = parse_qs(urlparse(raw).query)
    values = query.get("ItemName") or []
    if not values:
        return None
    return unquote(values[0]).strip()


def parse_short_descriptions(html: str) -> dict[str, str]:
    """Map AoN ItemName -> short description from the class=All list page."""
    soup = BeautifulSoup(html, "lxml")
    out: dict[str, str] = {}

    for span in soup.select("span[id^='MainContent_DataListTypes_LabelName_']"):
        link = span.select_one("a[href*='SpellDisplay.aspx']")
        if not link:
            continue
        item = item_name_from_href(link.get("href", ""))
        if not item:
            continue

        text = re.sub(r"\s+", " ", span.get_text(" ", strip=True)).strip()
        # List rows look like: "Spell Name M : Short blurb."
        if " : " not in text:
            continue
        short = text.split(" : ", 1)[1].strip()
        if short:
            out[item] = short

    return out


def main() -> None:
    print(f"Fetching {SPELL_LIST_URL} ...")
    response = SESSION.get(SPELL_LIST_URL, timeout=120)
    response.raise_for_status()

    short_by_item = parse_short_descriptions(response.text)
    print(f"  Parsed {len(short_by_item)} short descriptions from list page.")

    spells = json.loads(SPELLS_FILE.read_text())
    matched = 0
    missing: list[str] = []

    for spell in spells:
        item = item_name_from_href(spell.get("url", ""))
        if not item:
            missing.append(spell.get("name") or "?")
            spell["short_description"] = None
            continue
        short = short_by_item.get(item)
        spell["short_description"] = short
        if short:
            matched += 1
        else:
            missing.append(item)

    SPELLS_FILE.write_text(json.dumps(spells, indent=2, ensure_ascii=False) + "\n")
    print(f"  Updated {SPELLS_FILE.name}: {matched}/{len(spells)} spells matched.")
    if missing:
        print(f"  Missing short descriptions for {len(missing)} spells (first 20):")
        for name in missing[:20]:
            print(f"    - {name}")


if __name__ == "__main__":
    main()
