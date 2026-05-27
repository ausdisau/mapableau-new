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

## AV MCP (Cursor)

Autonomous Vehicle framework tools for agents: governance, trip transitions, suitability, advisory OSRM. See [docs/av-mcp.md](docs/av-mcp.md) and `.cursor/mcp.json` (`mapable-av` server).

```bash
npm run mcp:av
```

## Accessible ride-share

Product design for disability-focused managed transport (mobility schema, consent, dispatch, handover, optional pooling, NDIS booking bridge): see [docs/accessible-ride-share.md](docs/accessible-ride-share.md) and [STRATEGY.md](STRATEGY.md).

Provider UI:

| Route | Purpose |
|-------|---------|
| `/provider/transport/dispatch` | `TransportTrip` dispatch board with advisory match suggestions |
| `/provider/transport/runs` | Phase 2 ride pooling (`TRANSPORT_RIDE_POOLING_ENABLED=true`) |

## Tests

```bash
npm test -- tests/transport-scheduling-routing.test.ts
npm test -- tests/mobility-schema.test.ts
npm test -- tests/av-framework.test.ts
```
