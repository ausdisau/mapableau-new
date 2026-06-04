# Predictive search suggestions

Provider Finder and homepage search use a unified **predictive suggestions** layer: proactive curated results before typing, and ranked reactive results as the user types.

## Modes

| Mode | When | API |
|------|------|-----|
| `proactive` | Input focused, fewer than 2 characters | `GET /api/search/autocomplete?mode=proactive&context=homepage` |
| `reactive` | Query length ≥ 2 | `GET /api/search/autocomplete?q=...&mode=reactive&context=...` |

Responses include `groups` (same shape as before) and `meta` (`mode`, `degraded`, optional `sourceCounts`).

## Ranking (rules-based, no ML)

Scoring in `lib/search/suggestion-ranking.ts`:

- Prefix match on label (highest)
- Substring / keyword match
- `PopularSearch.weight`
- Verified providers
- Optional client `signals`: `recentQueries`, `preferredState` (from location field)

## Data sources

- `popular_searches`, `service_categories`, `searchable_locations`, `provider_profiles`, etc.
- Hero chips load from the same proactive catalog via `useProactiveChipSuggestions`, with static fallback in `HERO_SUGGESTED_SEARCHES_FALLBACK`.

## Setup

```bash
npx prisma db execute --schema prisma/schema.prisma --file prisma/sql/ensure-search-autocomplete.sql
npx tsx prisma/seed-search-autocomplete.ts
```

## Governance

Suggestions are explainable and advisory. This is not the masterplan ML “no-show / continuity risk” predictive layer.

## Limits

- Autocomplete rate limit remains per-process in-memory (120 req/min/IP); use a shared store for multi-instance production.
- Location data is local `searchable_locations` until a commercial geocoder adapter is configured.
