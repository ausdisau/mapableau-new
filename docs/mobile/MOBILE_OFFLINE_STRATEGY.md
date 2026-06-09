# Mobile offline strategy

Field workers need shift briefs when connectivity is poor. This document defines the offline-first pattern for the Capacitor shell and PWA fallback.

## Scope

- **Worker shift brief** — read-only cache of participant-safe support info
- **Incident drafts** — write locally, sync when online (future)
- **Timesheet drafts** — write locally, sync when online (future)

## Architecture

```
Capacitor WebView → GET /api/worker/shifts/:id/brief
                 → POST /api/worker/shifts/:id/brief/sync (client cache metadata)
                 → IndexedDB / Capacitor Preferences (client-side)
```

## Cache contract

See `mobile-contracts/schemas/worker-shift-brief.ts`. Clients store:

- `cachedAt` — ISO timestamp of last successful fetch
- `displayLabel`, `tasks`, `supportProfileBrief` — participant-safe fields only

## Sync rules

1. Fetch brief when shift status is `assigned` or `in_progress`
2. Cache TTL: 24 hours; stale cache shown with banner
3. On reconnect, POST sync metadata so server can audit offline usage
4. Never cache safeguarding flags or full medical records

## Capacitor integration

- Native shell loads production Vercel URL (`capacitor.config.ts`)
- Use `@capacitor/preferences` for brief blob storage
- Push notifications via FCM (`lib/notifications/fcm-service.ts`)

## Realtime fallback

When `REALTIME_PROVIDER=supabase`, messaging uses channel subscriptions instead of 5s polling. Polling remains the default for deployments without Supabase Realtime configured.

## QA checklist

- [ ] Brief loads offline after one online fetch
- [ ] Stale cache shows warning after TTL
- [ ] Sync POST returns 200 with valid session
- [ ] No PII beyond support profile brief in cache
