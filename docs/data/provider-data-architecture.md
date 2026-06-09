# Provider data architecture

Unifies provider search across static JSON and Prisma-backed NDIS registry.

## Problem

- ~77k provider outlets ingested into Prisma (`provider_outlets`)
- Provider Finder UI still reads `public/data/provider-outlets.json` by default
- Provider public pages use Prisma `Provider` model (separate from NDIS registry)

## Solution

`lib/provider/provider-data-service.ts` provides a single search API:

```typescript
const { source, providers, count } = await searchProviders({ q: "Melbourne", state: "VIC" });
```

## Data source selection

| Env | Behaviour |
|-----|-----------|
| `PROVIDER_DATA_SOURCE=prisma` (default when unset) | Try Prisma registry first, fall back to JSON |
| `PROVIDER_DATA_SOURCE=json` | Always use bundled JSON |

## Next steps (from todo.md)

- Server Component initial payload + shared PATCH logic for provider pages
- Type parity between frontend forms and API validation
- Switch Provider Finder map pins to Prisma when `PROVIDER_FINDER_MAP_SOURCE=ndis`

## Related

- `docs/data/ndis-provider-registry-prisma.md`
- `lib/ingestion/ndis-providers-search.ts`
- `scripts/ingest-ndis-providers.ts`
