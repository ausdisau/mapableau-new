# MapAble UI redesign

Care-combined marketing UI aligned with the MapAble Cursor Prompt Pack.

## Repo note

This workspace is `ausdisau/mapableau-new` (not `mapableau3`). Paths use `components/`, `lib/`, `app/` at repo root.

## Design tokens

- Colours: `mapable-blue`, `mapable-navy`, `mapable-teal`, `mapable-yellow`, `mapable-soft` in Tailwind
- CSS classes: `mapable-display`, `mapable-soft`, `mapable-wavy-letter`, `mapable-wavy-word`
- Fonts: Fredoka (display), Atkinson Hyperlegible (body) via `next/font/google`

## Routes

| Route | Description |
|-------|-------------|
| `/` | CareCombined homepage |
| `/provider-finder` | Guided provider discovery (live outlet data preserved) |
| `/ask` | Ask MapAble guidance |

## Registration constants

Centralised in `lib/brand/constants.ts`:

- ABN 55 641 613 541
- NDIS Registration Number: To be confirmed
- support@mapable.com.au
- 0434 083 624

## Marketing shell

- `components/marketing/mapable/MarketingHeader.tsx`
- `components/marketing/mapable/MarketingFooter.tsx`

Re-exported as `MapAbleMarketingHeader` / `MapAbleMarketingFooter` for existing layouts.

## Provider Finder layout

- Desktop: filters (left) · results (centre) · map + access layer (right, `xl+`)
- Mobile: stacked search, filters, results, map below results
- No-results state includes Ask MapAble + support contacts
- One labelled **Sponsored result** after the first organic result (sample data)

## Tests

```bash
pnpm exec vitest run tests/mapable-ui-redesign.test.tsx
pnpm exec tsc --noEmit
```

Note: full `pnpm run build` may fail on pre-existing ESLint import-order issues outside this UI work.
