# Platform Backend: Storage + Cron

This adds two backend infrastructure capabilities in the current stack:

1. **Platform object storage service** (`lib/storage/platform-object-storage.ts`)
2. **Scheduled storage maintenance** via secured cron endpoint (`app/api/internal/cron/storage-maintenance/route.ts`)

## Storage service

Backend selection:

- `PLATFORM_STORAGE_BACKEND=local` (default)
- `PLATFORM_STORAGE_BACKEND=s3` (placeholder; not configured in this change)

Local storage root:

- `.data/platform-storage`

Core API:

- `putObject({ key, body, contentType? })`
- `getObject(key)`
- `deleteObject(key)`
- `listPrefix(prefix)`
- `makeContentAddressedKey(prefix, body, extension?)`

## Cron maintenance endpoint

Route:

- `POST /api/internal/cron/storage-maintenance`

Authorization:

- Requires header `x-cron-token` matching `CRON_INTERNAL_TOKEN`

Query params:

- `retentionHours` (optional number, default 336 = 14 days)
- `dryRun=true` (optional)

Example:

```bash
curl -X POST \
  -H "x-cron-token: $CRON_INTERNAL_TOKEN" \
  "http://localhost:3000/api/internal/cron/storage-maintenance?retentionHours=168&dryRun=true"
```

## Scheduling

Use your scheduler of choice to call this route (e.g. Vercel Cron, Render cron, GitHub Actions).

For Vercel-style scheduling, configure a daily POST call with the token header from secret storage.
