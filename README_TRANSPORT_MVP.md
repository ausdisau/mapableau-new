# MapAble Transport MVP

Disability-aware transport booking, provider dispatch, driver trip execution, evidence, and safety reporting.

## Routes

| Audience | Path |
|----------|------|
| Participant | `/transport`, `/transport/book`, `/transport/trips`, `/transport/trips/[id]` |
| Provider | `/provider/transport`, `/provider/transport/requests`, `/provider/transport/dispatch`, `/provider/transport/trips/[id]` |
| Driver | `/driver/trips`, `/driver/trips/[id]`, `/driver/report-issue` |

Legacy participant URLs under `/dashboard/transport/*` redirect to `/transport/*`.

## API

- `POST /api/transport-mvp/requests` — create trip request
- `GET /api/transport-mvp/requests?scope=org` — provider inbox
- `POST /api/transport-mvp/requests/[id]/accept|decline`
- `GET /api/transport-mvp/trips` — role-scoped trip list
- `GET /api/transport-mvp/trips/[id]` — trip detail with address redaction
- `POST /api/transport-mvp/trips/[id]/dispatch` — assign driver + vehicle
- `POST /api/transport-mvp/trips/[id]/status` — driver status updates
- `POST /api/transport-mvp/trips/[id]/evidence` — km/time evidence
- `POST /api/transport-mvp/trips/[id]/confirm|dispute` — participant confirmation
- `GET /api/transport-mvp/trips/[id]/invoice-placeholder`
- `POST /api/transport-mvp/safety-reports`

## Database

Normalized `transport_*` tables (see Prisma models with `@@map`). Coexists with legacy `TransportBooking` for admin/phase seeds.

## Privacy and access control

- Participants see only their trips.
- Provider admins see organisation trips and full addresses.
- Assigned drivers see full addresses for their trips only.
- Other viewers receive suburb-level redacted addresses.
- Access needs details require `transport.accessibility_share` consent when shared with a provider.

## Maps

Uses MapLibre GL JS. Optional style URL:

```env
NEXT_PUBLIC_MAPLIBRE_STYLE_URL=https://demotiles.maplibre.org/style.json
```

## Limitations (MVP)

- No live GPS tracking (`TRANSPORT_LIVE_TRACKING_ENABLED` remains false for legacy module).
- Invoice amounts are placeholders — not NDIS payment approval.
- Pricing intelligence integration is not wired.

## Seed

Run full seed (`pnpm prisma db seed`) after Phase 1–3 seeds. `seed-transport-mvp.ts` adds demo vehicle, driver, request, and dispatched trip.
