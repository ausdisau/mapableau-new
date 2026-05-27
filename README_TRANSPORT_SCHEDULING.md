# Transport scheduling and routing API

Parallel scheduling domain alongside legacy `TransportBooking` (Phase 3). New trips use `transport_*` tables and `/api/transport/trips` routes.

## API surface

| Audience | Base path |
|----------|-----------|
| Participant / nominee (consent) | `/api/transport/trips` |
| Provider dispatch | `/api/provider/transport/*` |
| Driver | `/api/driver/transport/trips` |
| Routing (provider) | `/api/transport/routing/*` |

Responses include `permissions`, `nextActions`, optional `routeEstimate`, and role-shaped addresses (exact pickup/dropoff only for participant, consented nominee summary, provider org, assigned driver).

## Participant UI (control panel)

Signed-in participants use the control panel at `/dashboard` with transport trips under:

| Route | Purpose |
|-------|---------|
| `/dashboard/transport` | List scheduled transport trips (`listTransportTripsForUser`) |
| `/dashboard/transport/new` | Create a trip via `POST /api/transport/trips` |
| `/dashboard/transport/[tripId]` | Trip detail, advisory route estimate, actions from `nextActions` |
| `/dashboard/transport/legacy` | Older `TransportBooking` records (previous flow) |

Shared components live in `components/transport/` (`TransportTripStatusBadge`, `TransportTripListItem`, `TransportTripActions`, `TransportRouteAdvisory`).

## Environment

```env
TRANSPORT_ROUTING_ENABLED=true
TRANSPORT_ROUTING_PROVIDER=mock   # mock | osrm | graphhopper | openrouteservice
OSRM_BASE_URL=http://router.project-osrm.org
GRAPHHOPPER_API_KEY=
OPENROUTESERVICE_API_KEY=
```

## Consent

Nominee / family access requires active `transport.trip_access` consent from the participant.

## Routing

- Estimates are **advisory** (not guaranteed).
- Optimisation returns **suggestions** with `requiresHumanReview`; it does not auto-dispatch.
- Mock provider is default for local dev and tests.

## Governance

- Status changes write `transport_trip_events` and `audit_events`.
- Sensitive trip detail reads write `data_access_logs`.

## NDIS

This module does not perform or imply NDIS payment approval.

## Tests

```bash
npm test -- tests/transport-scheduling-routing.test.ts
```
