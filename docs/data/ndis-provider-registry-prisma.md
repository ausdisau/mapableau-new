# NDIS provider registry (local Prisma)

Store the NDIS **provider finder** static export in Postgres via Prisma model `ProviderOutletRegistry` (`provider_outlets` table).

**Source:** [list-providers.json](https://ndis.gov.au/sites/default/files/react_extract/provider_finder/build/data/list-providers.json) — same record shape as `public/data/provider-outlets.json` (`{ date?, data: ProviderOutlet[] }`).

## Setup

1. **Migrate**

   ```bash
   pnpm prisma migrate deploy
   ```

2. **Obtain JSON** (pick one)

   ```bash
   pnpm fetch:ndis-list-providers
   ```

   On HTTP 403, the script rsyncs `public/data/provider-outlets.json` into `data/ndis/list-providers.json`. For a copy on another host:

   ```bash
   export NDIS_LIST_PROVIDERS_RSYNC_SOURCE=user@host:/path/list-providers.json
   pnpm fetch:ndis-list-providers
   ```

3. **Seed** (~77k rows; use `--limit` for a quick dev pass)

   ```bash
   pnpm seed:ndis-provider-outlets
   pnpm seed:ndis-provider-outlets -- --limit 1000
   ```

   Options: `--file <path>`, `--batch <n>` (default 500).

4. **Classify** (dry-run summary from JSON or DB)

   ```bash
   pnpm classify:provider-outlets
   pnpm classify:provider-outlets -- --source db
   ```

5. **Seed classifications** (`support_types`, `access_need_ids` on every row)

   After migration `20260611180000_provider_outlet_classifications`:

   ```bash
   pnpm seed:provider-outlet-classifications
   pnpm seed:provider-outlet-classifications -- --limit 1000
   pnpm seed:provider-outlet-classifications -- --source json
   ```

   `--source db` (default) backfills existing `provider_outlets` rows from `raw` JSON or column fallbacks. `--source json` upserts classifications from `list-providers.json`. Safe to re-run.

   New imports via `pnpm seed:ndis-provider-outlets` include classifications automatically (`mapProviderOutletToPrisma`).

## Verify

```bash
pnpm prisma db execute --stdin <<'SQL'
SELECT COUNT(*) AS total FROM provider_outlets;
SELECT COUNT(*) AS active FROM provider_outlets WHERE active = true;
SELECT id, name, state, active FROM provider_outlets LIMIT 5;
SELECT COUNT(*) AS classified
FROM provider_outlets
WHERE cardinality(support_types) > 0 OR cardinality(access_need_ids) > 0;
SQL
```

Or in `prisma studio`:

```bash
pnpm prisma studio
```

## Query from app code

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const outlets = await prisma.providerOutletRegistry.findMany({
  where: { active: true, state: "NSW" },
  take: 50,
  orderBy: { name: "asc" },
});
```

The provider finder UI still reads static JSON by default (`lib/provider-outlets.ts`). Switching the UI to Prisma is a separate change.

## Related

| Store | Tool |
|-------|------|
| `provider_outlets` (Prisma) | `pnpm seed:ndis-provider-outlets` |
| Provider Finder classifications | `pnpm seed:provider-outlet-classifications` |
| `provider_outlets` (Supabase + RLS) | `docs/integrations/supabase-provider-import.md` |
| `provider_profiles` (search autocomplete) | `pnpm exec tsx prisma/seed-search-autocomplete.ts` |
