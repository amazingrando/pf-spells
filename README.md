# Spellscraper

Pathfinder spell data from [Archives of Nethys](https://www.aonprd.com/), plus a Next.js app to browse, filter, and build local spellbooks.

## Project layout

| Path | Purpose |
|------|---------|
| `aonprd_spell_scraper.py` | Scraper for AoN spell pages |
| `spells_with_classes.json` | Full scraped dataset (source of truth for the app) |
| `spells.json` / `spells_test.json` | Other scrape outputs |
| [`web/`](web/) | Next.js + shadcn/ui spell browser and spellbooks |

## Web app

The app lives in `web/`. Features:

- Filter and search ~3,000 Pathfinder spells (school, class, level, range, components, SR, and more)
- Grid or table results
- Spell detail modal with deep links
- Local spellbooks (stored in the browser) with share links and JSON import/export

### Local development

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other useful scripts (from `web/`):

```bash
npm run build      # production build
npm run start      # serve production build
npm run typecheck  # TypeScript
npm run lint
```

### Regenerating app data

After re-scraping, rebuild `web/data/spells.json`:

```bash
cd web
npm run data:build
```

To refresh AoN list-page short descriptions into `spells_with_classes.json` (then rebuild app data):

```bash
python3 enrich_short_descriptions.py
cd web && npm run data:build
```

## Deploy on Netlify

Config lives in [`web/netlify.toml`](web/netlify.toml) (Next.js adapter + build settings).

### Netlify UI build settings (important)

Open **Project configuration → Build & deploy → Build settings → Configure** and set:

| Field | Value |
|------|--------|
| Base directory | `web` |
| Package directory | *(leave empty)* |
| Build command | `npm run build` |
| Publish directory | `.next` |

Do **not** set publish to `web/.next` when base is already `web` — Netlify resolves publish *relative to base*, so that looks for `web/web/.next` and you get “Page not found”.

### Option A — Netlify UI

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Netlify: **Add new site → Import an existing project** (or trigger a new deploy after fixing settings above).
3. Apply the build settings table, then deploy.

### Option B — Netlify CLI

```bash
npm install -g netlify-cli
cd web
netlify login
netlify link
netlify deploy --build --prod
```

### Notes

- Spellbooks use `localStorage` in each visitor’s browser. They are not stored on Netlify.
- Share links encode the spellbook in the URL (`?book=…`) so others can import a copy.
- Node **20+** is required (`NODE_VERSION = 22` in `web/netlify.toml`).

## License / data

Spell text and mechanics are from Archives of Nethys / Paizo. This project is a personal tool for browsing and organizing that data; respect Paizo’s community use and AoN terms when redistributing content.
