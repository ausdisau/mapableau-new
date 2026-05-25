# MapAble Core — Phase 4

Phase 4 adds intelligence and governance: **matching**, **provider search**, **trip tracking**, **driver web app**, **timesheets**, **incidents**, **service agreements**, **NDIS line-item suggestions**, **smart contract runner**, **attestations**, and **admin analytics**.

## Deploy

```bash
npx prisma db push && npx prisma generate && pnpm prisma db seed
```

## Configuration

See `.env.example` — `MATCHING_ENGINE_ENABLED`, `SMART_CONTRACT_RUNNER_ENABLED`, `TRANSPORT_LIVE_LOCATION_ENABLED=false`, etc.

## Main routes

| Module | Routes |
|--------|--------|
| Matching | `/admin/matching`, `/api/matching/*` |
| Search | `/dashboard/find-support` |
| Driver | `/driver/trips` |
| Tracking | `/api/transport/:id/tracking` |
| Timesheets | `/api/timesheets/*` |
| Incidents | `/dashboard/incidents/new` |
| Analytics | `/admin/analytics` |
| Contracts | `/api/contracts/run` |

## Limitations

No AI matching, no NDIS Commission auto-reporting, no live GPS by default, no native mobile app.

## Phase 5

AI-assisted matching, NDIA API readiness, native mobile scaffold, advanced route optimisation.

See module READMEs: `README_MATCHING_FOUNDATION.md`, `README_INCIDENT_REPORTING.md`, etc.
