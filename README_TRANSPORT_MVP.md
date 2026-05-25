# MapAble Transport MVP

Disability-aware transport booking, provider dispatch, driver trip execution, evidence, and safety reporting.

## Routes

| Audience | Path |
| --- | --- |
| Participant | `/transport`, `/transport/book`, `/transport/trips`, `/transport/trips/[id]` |
| Provider | `/provider/transport`, `/provider/transport/requests`, `/provider/transport/dispatch`, `/provider/transport/trips/[id]` |
| Driver | `/driver/trips`, `/driver/trips/[id]`, `/driver/report-issue` |

Legacy participant URLs under `/dashboard/transport/*` redirect to `/transport/*`.

## API

- `POST /api/transport-mvp/requests` - create trip request
- `GET /api/transport-mvp/requests?scope=org` - provider inbox
- `POST /api/transport-mvp/requests/[id]/accept|decline`
- `GET /api/transport-mvp/trips` - role-scoped trip list
- `GET /api/transport-mvp/trips/[id]` - trip detail with address redaction
- `POST /api/transport-mvp/trips/[id]/dispatch` - assign driver + vehicle
- `POST /api/transport-mvp/trips/[id]/status` - driver status updates
- `POST /api/transport-mvp/trips/[id]/evidence` - km/time evidence
- `POST /api/transport-mvp/trips/[id]/confirm|dispute` - participant confirmation
- `GET /api/transport-mvp/trips/[id]/invoice-placeholder`
- `POST /api/transport-mvp/safety-reports`

## Database

Normalized `transport_*` tables are declared in Prisma models with `@@map`. This coexists with the legacy `TransportBooking` model for existing admin and phase features.

## Privacy and access control

- Participants see only their own trips.
- Provider admins see trips for their organisation.
- Assigned drivers see full addresses for their assigned trips only.
- Other viewers receive suburb-level redacted addresses.
- Access needs details require `transport.accessibility_share` consent when shared with a provider.

## Maps

Uses MapLibre GL JS. Optional style URL:

```env
NEXT_PUBLIC_MAPLIBRE_STYLE_URL=https://demotiles.maplibre.org/style.json
```

## Limitations

- No live GPS tracking in this MVP.
- Invoice amounts are placeholders, not NDIS payment approval.
- NDIS Pricing Intelligence is not wired yet.

## Seed

Run the full seed after applying migrations. `seed-transport-mvp.ts` adds a demo vehicle, driver, request, and dispatched trip.
