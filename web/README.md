# Spellscraper Web

Next.js 16 + shadcn/ui app for browsing Pathfinder spells and managing local spellbooks.

## Features

- Search and filter spells by school, subschool, descriptor, class, level, range, components, spell resistance, and mythic
- Grid and table layouts (preference saved in the browser)
- Spell detail modal with shareable `?spell=` links
- Spellbooks stored in `localStorage`, with compressed share URLs (`?book=`) and JSON import/export

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm run start
npm run typecheck
npm run lint
```

## Data

Runtime data is [`data/spells.json`](data/spells.json), built from `../spells_with_classes.json`.

Regenerate after scraping:

```bash
python3 scripts/build-spells-data.py
```

Or run the equivalent inline script from the repo root README.

## Deploy

Deploy from the **repository root** using the root [`netlify.toml`](../netlify.toml) (`base = "web"`). See the [root README](../README.md#deploy-on-netlify) for Netlify UI and CLI steps.

## Stack

- Next.js App Router + React 19
- Tailwind CSS v4 + shadcn/ui (Base UI)
- `lz-string` for spellbook share payloads
