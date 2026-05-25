# NDIS provider ingestion

MapAble ingests the public NDIS provider finder static JSON for provider discovery, care matching, transport coordination, and search.

## Source

`https://www.ndis.gov.au/sites/default/files/react_extract/provider_finder/build/data/list-providers.json`

This is a **directory input** bundled with the NDIS React app — not a guaranteed stable public API. Do not call it frequently. Do not present ingested providers as “verified by MapAble” until a separate verification layer confirms current registration.

Raw JSON is stored on each row (`ndis_providers.raw`) for reprocessing.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes (live ingest) | PostgreSQL connection string |
| `NDIS_PROVIDER_SOURCE_URL` | No | Override source URL (defaults to NDIS URL above) |
| `ADMIN_CRON_SECRET` | Yes (cron/API) | Bearer token for `POST /api/admin/ingest/ndis-providers` |
| `DRY_RUN` | No | Set to `true` to fetch and normalise without writing |
| `PGSSL` | No | Use if your host requires SSL (via connection string params) |

## Commands

```bash
# Dry run — prints counts, sample provider, raw field keys
pnpm ingest:ndis-providers:dry

# With local file when automated download is blocked (Cloudflare)
pnpm ingest:ndis-providers -- --input ./list-providers.json

# Live upsert into ndis_providers + ingestion run log
pnpm ingest:ndis-providers
```

## Database tables

- `ndis_provider_ingestion_runs` — run metadata, status, hashes
- `ndis_providers` — normalised rows keyed by `source_id`

Apply schema:

```bash
pnpm prisma migrate deploy
```

## Cron (Vercel)

`vercel.json` schedules daily ingestion at **17:15 UTC** (`POST /api/admin/ingest/ndis-providers`).

```http
Authorization: Bearer <ADMIN_CRON_SECRET>
```

## Search API

`GET /api/providers/ndis/search?q=&state=&postcode=&service=&limit=25`

Returns public fields only (no `raw` JSON). Max `limit` 100.

## Admin UI

`/admin/ndis-provider-ingestion` — last run status and manual “Run ingestion now” (session admin auth, not the cron secret).

## TODO

- Stale provider handling: archive or flag rows missing from the latest successful ingest.
