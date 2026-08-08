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
python3 scripts/build-spells-data.py
```

(If that script is missing, see [`web/README.md`](web/README.md) for an inline snippet.)

## Deploy on Netlify

The site is configured via [`netlify.toml`](netlify.toml) at the repo root (`base = "web"`).

### Option A — Netlify UI

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Netlify: **Add new site → Import an existing project**.
3. Select the repo. Netlify should pick up `netlify.toml` (base `web`, `npm run build`).
4. Deploy. No extra plugins are required — Netlify’s Next.js adapter runs automatically for Next.js 16.

### Option B — Netlify CLI

```bash
npm install -g netlify-cli
# from repo root
netlify login
netlify init    # or: netlify link
netlify deploy --build --prod
```

### Notes

- Spellbooks use `localStorage` in each visitor’s browser. They are not stored on Netlify.
- Share links encode the spellbook in the URL (`?book=…`) so others can import a copy.
- Node **20+** is recommended (set in `netlify.toml`).

## License / data

Spell text and mechanics are from Archives of Nethys / Paizo. This project is a personal tool for browsing and organizing that data; respect Paizo’s community use and AoN terms when redistributing content.
