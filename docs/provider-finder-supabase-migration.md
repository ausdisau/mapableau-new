# Provider Finder Supabase Migration

This is the non-destructive start point for moving provider finder data from the public JSON catalogue into Supabase Postgres.

## Current State

- The provider finder UI reads `public/data/provider-outlets.json` through `fetchProviderOutlets()`.
- Client-side mapping in `app/provider-finder/outletToProvider.ts` derives display providers from NDIA outlet records.
- Server-side search already has Prisma models for `provider_profiles`, `provider_services`, service categories, searchable locations, and popular searches.
- Supabase is configured as the preferred hosted Postgres target, but live migration requires private database credentials and target confirmation.

## Safe Work Started

Run a dry-run mapping check without writing to any database:

```bash
pnpm provider-finder:supabase:dry-run
```

The dry run validates the source JSON, maps it to the current `provider_profiles` and `provider_services` shape, reports duplicate or incomplete records, and prints which live migration environment variables are missing. It performs no Supabase API calls and no database writes.

To write a local preview payload for review:

```bash
pnpm provider-finder:supabase:dry-run -- --write=provider-finder-supabase-import.json.tmp
```

The `.tmp` suffix keeps generated preview data out of git.

## Live Migration Blockers

Do not run a live import until these are available and confirmed:

- `DATABASE_URL` for the Supabase pooled runtime connection.
- `DIRECT_URL` for Prisma migration/schema commands.
- `SUPABASE_SERVICE_ROLE_KEY` only for server-side Supabase API operations; never expose it with `NEXT_PUBLIC_*`.
- Target Supabase project confirmation.
- Source database or JSON backup confirmation.
- A staging dry run against the target schema.

The public values `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are not database credentials and are not enough to migrate data.

## Next Implementation Step

The current Prisma catalogue schema supports core searchable fields but not full provider-finder parity. Before switching the UI from JSON to Supabase, add nullable columns or related tables for outlet metadata such as ABN, outlet key, contact details, address, latitude/longitude, opening hours, and raw source provenance. Add these as non-destructive Prisma migrations, test on staging, then run the import with explicit approval.
