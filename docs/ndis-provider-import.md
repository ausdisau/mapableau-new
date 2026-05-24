# NDIS Provider Finder → `Provider` table

Imports the public NDIS **list-providers** registry into Prisma `Provider`, with related `Service` and `ServiceLocation` rows.

## Data source

Official JSON (same schema as the copy in this repo):

https://www.ndis.gov.au/sites/default/files/react_extract/provider_finder/build/data/list-providers.json

Bundled locally at `public/data/provider-outlets.json` (updated periodically; January 2026 snapshot ≈ 77k outlet rows → ~26k providers by ABN).

Direct download from NDIS servers may return **403** from CI/cloud IPs; use the local file or download manually into `public/data/provider-outlets.json`.

## Import behaviour

- One `Provider` per **ABN** (`businessType: ndis_registry`, stable id `ndis-{abn}`)
- Outlets merged into `ServiceLocation` (deduped, max 50 per provider)
- Registration groups → `specialisations` and `Service` names
- `--fresh` deletes existing `ndis_registry` providers before import (does not remove demo seed providers)

## Commands

```bash
# Full import (can take several minutes)
pnpm seed:ndis-providers

# Replace previous NDIS import only
pnpm seed:ndis-providers -- --fresh

# Smoke test
pnpm seed:ndis-providers -- --limit 50

# Try live download, then fall back to local file
pnpm seed:ndis-providers -- --download

# Custom file path
pnpm seed:ndis-providers -- --file public/data/provider-outlets.json
```

Requires `DATABASE_URL` and `pnpm prisma migrate deploy`.

## Tests

```bash
pnpm test tests/ndis-provider-import.test.ts
```
