# Spellscraper Web

Next.js + shadcn/ui browser for Pathfinder spells scraped from Archives of Nethys.

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data

Spell data lives in `data/spells.json` (slimmed from `../spells_with_classes.json`).

To regenerate after scraping:

```bash
python3 - <<'PY'
import json
from pathlib import Path
src = Path("../spells_with_classes.json")
out = Path("data/spells.json")
spells = json.loads(src.read_text())
slim = []
for s in spells:
    desc = s.get("description_text") or ""
    if len(desc) > 400:
        desc = desc[:397].rsplit(" ", 1)[0] + "…"
    slim.append({
        "name": s.get("name"),
        "url": s.get("url"),
        "school": s.get("school"),
        "subschool": s.get("subschool"),
        "descriptor": s.get("descriptor"),
        "casting_time": s.get("casting_time"),
        "components": s.get("components"),
        "range": s.get("range"),
        "duration": s.get("duration"),
        "saving_throw": s.get("saving_throw"),
        "spell_resistance": s.get("spell_resistance"),
        "description": desc,
        "mythic": bool(s.get("mythic")),
        "classes": s.get("classes") or {},
    })
out.write_text(json.dumps(slim, separators=(",", ":")))
print(len(slim), "spells")
PY
```
