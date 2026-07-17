# MapAble Suburb Access Guides Cursor Pack

This pack gives Cursor a repo-ready scaffold for a national suburb-level Access Guide system for `mapable.com.au`.

It is designed for a Next.js App Router + TypeScript + Tailwind codebase, but the data model and content standards can be adapted to other stacks.

## What this pack adds

```txt
src/app/guides/suburbs/page.tsx
src/app/guides/suburbs/[state]/page.tsx
src/app/guides/suburbs/[state]/[slug]/page.tsx
src/app/guides/suburbs/[state]/[slug]/report-update/page.tsx
src/app/api/guides/suburbs/route.ts
src/app/api/guides/suburbs/report-update/route.ts
src/components/guides/suburbs/*
src/data/suburbAccessGuides.sample.ts
src/lib/guides/*
src/types/suburbAccessGuide.ts
tools/import-abs-sal-geojson.ts
supabase/sql/suburb_access_guides.sql
docs/*
```

## Design intent

MapAble Suburb Access Guides are local, practical access pages that answer:

- Can I get there?
- Can I park or be dropped off safely?
- Can I find a toilet?
- Can I move around without steps, confusing routes, or avoidable overload?
- Are there quiet, lower-sensory places nearby?
- What still needs local verification?

The pages use careful verification language. They provide practical access information, not a guarantee of access and not legal, medical, transport or NDIS advice.

## Install notes

If the existing project does not already include a map library, install Leaflet:

```bash
npm install leaflet
npm install -D @types/leaflet
```

Add Leaflet CSS once in the project, usually in `src/app/layout.tsx` or `src/app/globals.css` depending on your repo rules:

```ts
import 'leaflet/dist/leaflet.css';
```

For production, configure a proper tile provider or self-hosted OpenStreetMap-derived tile endpoint. Do not hardcode a public demo tile endpoint for high-traffic production use.

## Important implementation notes

- The included data is a starter sample only.
- To create guide records for every suburb/locality, import official suburb/locality boundary data into `data/raw/sal.geojson` and run the import tool.
- Keep thin pages `noindex` until they have useful guide content.
- Every public guide must show a verification status and last updated date.
- Every map view must have an accessible list-view equivalent.

## Suggested Cursor flow

1. Copy this pack into the root of the website repo.
2. Open `CURSOR_PROMPT.md`.
3. Paste it into Cursor Agent.
4. Ask Cursor to inspect the repo, adapt paths, and install dependencies only if needed.
5. Run lint and typecheck.

## Starter routes

- `/guides/suburbs`
- `/guides/suburbs/act/braddon`
- `/guides/suburbs/nsw/parramatta`
- `/guides/suburbs/vic/brunswick`
- `/guides/suburbs/qld/south-brisbane`

## Data import path

```txt
official SAL GeoJSON/CSV
-> tools/import-abs-sal-geojson.ts
-> data/generated/suburb-access-guides.generated.json
-> database import or codegen
-> public pages with status gating
```

## Status language

Use these public labels:

- Draft guide
- Data-enriched
- Community reported
- Partner supplied
- MapAble reviewed
- MapAble verified
- Needs local verification

Do not use language that implies legal certification unless the page is specifically about a MapAble Accreditation assessment and includes the appropriate disclaimer.
