#!/usr/bin/env python3
from __future__ import annotations
"""
Archives of Nethys (PF1e) - Full Spell Data Extractor
======================================================
Scrapes all spells from https://www.aonprd.com/Spells.aspx?Class=All
and fetches full detail pages for each spell, saving everything as JSON.

Usage:
    pip install requests beautifulsoup4 lxml
    python aonprd_spell_scraper.py

Output:
    spells.json       — full structured data for all spells
    spells_errors.json — any spells that failed to parse (for retry)

Notes:
    - Politely rate-limited to ~1 req/sec by default (adjust DELAY below)
    - Resumable: already-fetched spells are skipped if spells.json exists
    - ~2,000+ spells, expect ~60-90 minutes at default rate limit
"""

import argparse
import json
import re
import time
import os
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# ── Configuration ────────────────────────────────────────────────────────────

BASE_URL = "https://www.aonprd.com"
SPELL_LIST_URL = f"{BASE_URL}/Spells.aspx?Class=All"
OUTPUT_FILE = "spells.json"
ERRORS_FILE = "spells_errors.json"
DELAY = 1.0  # seconds between requests (be polite!)
TEST_BATCH_SIZE = 10  # number of spells to fetch in test mode

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
})

# ── Step 1: Fetch spell list ──────────────────────────────────────────────────

def get_spell_links() -> list[dict]:
    """Fetch the main spell list and return [{name, url}, ...]."""
    print(f"Fetching spell list from {SPELL_LIST_URL} ...")
    r = SESSION.get(SPELL_LIST_URL, timeout=30)
    r.raise_for_status()

    soup = BeautifulSoup(r.text, "lxml")
    links = soup.select("a[href*='SpellDisplay.aspx']")

    spells = []
    seen = set()
    for a in links:
        href = a.get("href", "")
        name = a.get_text(strip=True)
        if href and name and href not in seen:
            seen.add(href)
            full_url = href if href.startswith("http") else f"{BASE_URL}/{href.lstrip('/')}"
            spells.append({"name": name, "url": full_url})

    print(f"  Found {len(spells)} unique spell links.")
    return spells


# ── Step 2: Parse a single spell detail page ─────────────────────────────────

# Maps the bold <b> labels found in the stat block to spell dict keys.
LABEL_TO_FIELD = {
    "source": "source",
    "level": "level",
    "casting time": "casting_time",
    "components": "components",
    "component": "components",
    "range": "range",
    "area": "area",
    "target": "target",
    "targets": "target",
    "effect": "effect",
    "duration": "duration",
    "saving throw": "saving_throw",
    "spell resistance": "spell_resistance",
}


def _clean(text: str) -> str:
    """Collapse whitespace and strip trailing separators."""
    return re.sub(r"\s+", " ", text).strip().strip(";,").strip()


def _split_paren_aware(text: str) -> list[str]:
    """Split on top-level commas, ignoring commas inside parentheses.

    e.g. "wizard 4 (Ifrit, Oread, Suli)" stays a single chunk.
    """
    parts: list[str] = []
    buf: list[str] = []
    depth = 0
    for ch in text:
        if ch == "(":
            depth += 1
            buf.append(ch)
        elif ch == ")":
            depth = max(0, depth - 1)
            buf.append(ch)
        elif ch == "," and depth == 0:
            parts.append("".join(buf))
            buf = []
        else:
            buf.append(ch)
    if buf:
        parts.append("".join(buf))
    return [p.strip() for p in parts if p.strip()]


def parse_class_levels(level: str | None) -> dict[str, int]:
    """Parse a "Level" string into a {class_name: spell_level} mapping.

    The Level field looks like:
        "cleric 1, inquisitor 1, oracle 1, paladin 1, warpriest 1 (Abadar)"
        "bloodrager 1, ..., summoner (unchained) 1 (Grippli)"

    Rules:
        - Deity/race restrictions in parentheses (e.g. "(Abadar)", "(sylph)")
          are ignored; only the class and its numeric level are recorded.
        - "summoner (unchained)" is recorded as a distinct key
          "summoner_unchained".
    """
    classes: dict[str, int] = {}
    if not level:
        return classes

    for chunk in _split_paren_aware(level):
        unchained = "(unchained)" in chunk.lower()
        # Drop any parenthetical (deity/race restriction or "unchained" marker).
        no_paren = re.sub(r"\([^)]*\)", "", chunk).strip()
        m = re.match(r"^(.*?)\s+(\d+)$", no_paren)
        if not m:
            continue
        name = m.group(1).strip().lower().replace(" ", "_")
        if not name:
            continue
        if unchained:
            name += "_unchained"
        classes[name] = int(m.group(2))

    return classes


def parse_spell_page(html: str, url: str, name: str) -> list[dict]:
    """
    Parse a SpellDisplay.aspx page into a list of structured spell dicts.

    The stat block(s) + description(s) live inside a single <span>. Most pages
    hold one spell, but some pages list several related spells (e.g. "Absorb
    Rune I / II / III" or "Age Resistance, Lesser / Age Resistance / ...,
    Greater"), each introduced by its own <h1> header inside that one span:

      <h1>Spell Name</h1>
      <b>Source</b> ...
      <b>School</b> ...; <b>Level</b> ...
      <h3 class="framing">Casting</h3>
      <b>Casting Time</b> ... <b>Components</b> ...
      <h3 class="framing">Effect</h3>
      <b>Range</b> ... <b>Target</b> ... <b>Duration</b> ...
      <b>Saving Throw</b> ...; <b>Spell Resistance</b> ...
      <h3 class="framing">Description</h3>
      ...description body...
      <h1>Next Spell Name</h1>
      ...

    We split the span's flat child list into one segment per <h1> (each
    segment runs from its <h1> up to the next <h1>) and parse each segment
    independently. Note that every variant URL returns the *same* combined
    page, so the same spell name can be reached from multiple URLs.
    """
    soup = BeautifulSoup(html, "lxml")

    # The stat block(s) + description(s) live in one of these LabelName spans.
    # AoN sometimes emits an empty leading span and puts the real content in a
    # later one, so gather children from ALL matching spans (empty ones simply
    # contribute nothing) rather than trusting a single index.
    spans = soup.find_all(
        "span", id=re.compile(r"MainContent_DataListTypes_LabelName_\d+$")
    )
    nodes: list = []
    for span in spans:
        nodes.extend(span.children)

    if not nodes:
        table = soup.find("table", id="MainContent_DataListTypes")
        if table is None:
            return []
        nodes = list(table.children)

    # Split the flat child list into per-spell segments at each <h1>.
    segments: list[list] = []
    current: list = []
    seen_h1 = False
    for node in nodes:
        if getattr(node, "name", None) == "h1":
            if seen_h1:
                segments.append(current)
                current = []
            seen_h1 = True
        current.append(node)
    if current:
        segments.append(current)

    # No <h1> at all → treat everything as a single segment.
    if not segments:
        segments = [nodes]

    spells = [_parse_segment(seg, url, name) for seg in segments]
    return [s for s in spells if s is not None]


def _parse_segment(nodes: list, url: str, fallback_name: str) -> dict:
    """
    Parse the nodes of a single spell (one <h1> block) into a structured dict.

    There is NO <hr> separating stat block from description; section
    boundaries are the <h3 class="framing"> headers and the <b> labels.
    We walk the flat node list, attributing each run of content to the most
    recent <b> label until the Description header, after which everything is
    the description body (until an optional "Mythic <Name>" <h2>).
    """
    spell = {
        "name": fallback_name,
        "url": url,
        "school": None,
        "subschool": None,
        "descriptor": None,
        "level": None,
        "classes": {},
        "casting_time": None,
        "components": None,
        "range": None,
        "area": None,
        "target": None,
        "effect": None,
        "duration": None,
        "saving_throw": None,
        "spell_resistance": None,
        "source": None,
        "description_text": None,
        "mythic": False,
        # Populated only when a "Mythic <Name>" section is present:
        #   {"name", "source", "description_text"}
        "mythic_version": None,
        "flags": [],
    }

    # Spell name from the <h1> introducing this segment.
    for node in nodes:
        if getattr(node, "name", None) == "h1":
            spell["name"] = node.get_text(strip=True)
            break

    # ── Walk the flat node list ──────────────────────────────────────────────
    # The segment flows: stat block → Description (<h3>) → optional Mythic (<h2>).
    fields: dict[str, str] = {}
    current_label = None          # the active <b> label key, e.g. "source"
    buffer: list[str] = []        # text accumulated for the current label
    description_nodes: list = []  # raw nodes after the Description header
    mythic_name = None            # text of the "Mythic <Name>" <h2> header
    mythic_nodes: list = []       # raw nodes after the Mythic header
    in_description = False
    in_mythic = False

    def flush():
        nonlocal current_label, buffer
        if current_label is not None:
            val = _clean("".join(buffer))
            if val and current_label not in fields:
                fields[current_label] = val
        current_label = None
        buffer = []

    for node in nodes:
        node_name = getattr(node, "name", None)

        # A "Mythic <Name>" <h2> header ends the regular description and starts
        # the mythic section.
        if node_name == "h2" and "mythic" in node.get_text().lower():
            flush()
            in_mythic = True
            in_description = False
            mythic_name = node.get_text(strip=True)
            continue

        if in_mythic:
            mythic_nodes.append(node)
            continue

        if node_name == "h3" and "description" in node.get_text().lower():
            flush()
            in_description = True
            continue

        if in_description:
            description_nodes.append(node)
            continue

        if node_name == "h1":
            continue
        if node_name == "h3":
            # Section header (Casting / Effect) — ends the current field.
            flush()
            continue
        if node_name == "b":
            flush()
            label = node.get_text(strip=True).lower().rstrip(":")
            current_label = label
            continue

        # Plain text or inline element (a, i, u, br, img, ...) → current field.
        if hasattr(node, "get_text"):
            buffer.append(node.get_text(" "))
        else:
            buffer.append(str(node))

    flush()

    # ── Map collected labels onto the spell dict ─────────────────────────────
    for label, value in fields.items():
        field = LABEL_TO_FIELD.get(label)
        if field:
            spell[field] = value

    # ── Per-class spell levels ───────────────────────────────────────────────
    # Parse the "Level" string (e.g. "bard 2, medium 1, ...") into a
    # {class: level} mapping for easy per-class querying.
    spell["classes"] = parse_class_levels(spell.get("level"))

    # ── School / Subschool / Descriptor ──────────────────────────────────────
    # The School <b> value looks like: "abjuration (creation) [force]".
    school_label = fields.get("school")
    if school_label:
        m = re.match(
            r"\s*([A-Za-z/ ]+?)"
            r"(?:\s*\(([^)]+)\))?"      # optional subschool
            r"(?:\s*\[([^\]]+)\])?\s*$",  # optional descriptor
            school_label,
        )
        if m:
            spell["school"] = m.group(1).strip().lower()
            spell["subschool"] = m.group(2).strip() if m.group(2) else None
            spell["descriptor"] = m.group(3).strip() if m.group(3) else None
        else:
            spell["school"] = school_label

    # ── Description ──────────────────────────────────────────────────────────
    if description_nodes:
        desc_html = "".join(str(n) for n in description_nodes).strip()
        spell["description_text"] = _clean(
            BeautifulSoup(desc_html, "lxml").get_text(" ")
        )

    # ── Mythic version ───────────────────────────────────────────────────────
    # The mythic section is its own "Mythic <Name>" block with a Source line
    # followed by the augmented description.
    if mythic_name is not None:
        spell["mythic"] = True

        mythic_source = None
        mythic_desc_nodes: list = []
        m_in_source = False
        m_source_buf: list[str] = []
        for node in mythic_nodes:
            nm = getattr(node, "name", None)
            if nm == "b":
                label = node.get_text(strip=True).lower().rstrip(":")
                m_in_source = label == "source"
                if m_in_source:
                    continue
                # Any other bold label is part of the augmented description.
                mythic_desc_nodes.append(node)
                continue
            if m_in_source:
                if nm == "br":
                    m_in_source = False  # source is a single line
                    continue
                m_source_buf.append(
                    node.get_text(" ") if hasattr(node, "get_text") else str(node)
                )
                continue
            # Skip the blank line(s) before the description body begins.
            if nm == "br" and not mythic_desc_nodes:
                continue
            mythic_desc_nodes.append(node)

        mythic_source = _clean("".join(m_source_buf)) or None
        mythic_desc_html = "".join(str(n) for n in mythic_desc_nodes).strip()
        mythic_desc_text = _clean(
            BeautifulSoup(mythic_desc_html, "lxml").get_text(" ")
        ) if mythic_desc_html else None

        spell["mythic_version"] = {
            "name": mythic_name,
            "source": mythic_source,
            "description_text": mythic_desc_text,
        }

    # ── Component flags (F M R T Y) ──────────────────────────────────────────
    # These are superscript letters appended to component abbreviations,
    # e.g. "V, S, M, F" → focus. Derive them from the Components value rather
    # than the spell name (the name has no such letters).
    flag_map = {"F": "focus", "M": "material", "R": "race",
                "DF": "divine_focus"}
    components = spell.get("components") or ""
    comp_tokens = {t.strip() for t in re.split(r"[,\s]+", components) if t.strip()}
    for flag, label in flag_map.items():
        if flag in comp_tokens:
            spell["flags"].append(label)

    return spell


# ── Step 3: Fetch and parse each spell ───────────────────────────────────────

def fetch_spell(spell_info: dict) -> list[dict] | None:
    """Fetch a single spell detail page and return parsed data.

    A page may contain several spells, so this returns a list. Returns None
    only on a fetch/parse error (so the caller can record a retry).
    """
    try:
        r = SESSION.get(spell_info["url"], timeout=30)
        r.raise_for_status()
        return parse_spell_page(r.text, spell_info["url"], spell_info["name"])
    except Exception as e:
        print(f"  ERROR fetching {spell_info['name']}: {e}")
        return None


# ── Step 4: Main orchestration ────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Scrape spell data from Archives of Nethys (PF1e)")
    parser.add_argument(
        "--test",
        action="store_true",
        help=f"Fetch only the first {TEST_BATCH_SIZE} spells and save to spells_test.json",
    )
    parser.add_argument(
        "--test-size",
        type=int,
        default=TEST_BATCH_SIZE,
        metavar="N",
        help=f"Number of spells to fetch in test mode (default: {TEST_BATCH_SIZE})",
    )
    args = parser.parse_args()

    test_mode = args.test
    output_file = "spells_test.json" if test_mode else OUTPUT_FILE

    if test_mode:
        print(f"=== TEST MODE: fetching first {args.test_size} spells → {output_file} ===\n")

    # Load any existing progress (skipped in test mode so it always reruns fresh).
    # Keyed by spell name: a single page can hold several spells, and the same
    # spell is reachable from multiple variant URLs, so name is the stable key.
    existing = {}
    if not test_mode and Path(output_file).exists():
        with open(output_file) as f:
            existing_list = json.load(f)
        existing = {s["name"]: s for s in existing_list}
        print(f"Resuming: {len(existing)} spells already saved.")

    # Get full spell list
    spell_links = get_spell_links()

    if test_mode:
        spell_links = spell_links[:args.test_size]

    results = dict(existing)
    new_errors = []

    total = len(spell_links)
    for i, spell_info in enumerate(spell_links, 1):
        # Skip if a previously parsed page already yielded this spell. Variant
        # pages (e.g. "... II", "..., Greater") share one combined page, so
        # once any sibling is fetched the rest are already captured by name.
        if spell_info["name"] in results:
            continue

        print(f"[{i}/{total}] {spell_info['name']} ...")
        data = fetch_spell(spell_info)

        if data is None:
            new_errors.append(spell_info)
        else:
            for spell in data:
                if spell["name"] not in results:
                    results[spell["name"]] = spell

        # Save progress every 50 spells (skipped in test mode)
        if not test_mode and i % 50 == 0:
            _save(results, new_errors, output_file)
            print(f"  Progress saved ({len(results)} done, {len(new_errors)} errors)")

        time.sleep(DELAY)

    # Final save
    _save(results, new_errors, output_file)
    print(f"\nDone! {len(results)} spells saved to {output_file}")
    if new_errors:
        errors_file = "spells_test_errors.json" if test_mode else ERRORS_FILE
        print(f"  {len(new_errors)} errors saved to {errors_file} — re-run to retry")


def _save(results: dict, errors: list, output_file: str = OUTPUT_FILE):
    spell_list = list(results.values())
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(spell_list, f, indent=2, ensure_ascii=False)
    if errors:
        errors_file = output_file.replace(".json", "_errors.json")
        with open(errors_file, "w", encoding="utf-8") as f:
            json.dump(errors, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()