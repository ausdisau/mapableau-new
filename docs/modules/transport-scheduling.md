# Transport scheduling and routing API

Parallel scheduling domain alongside legacy `TransportBooking` (Phase 3). New trips use `transport_*` tables and `/api/transport/trips` routes.

## API surface

| Audience | Base path |
|----------|-----------|
| Participant / nominee (consent) | `/api/transport/trips` |
| Provider dispatch | `/api/provider/transport/*` |
| Driver | `/api/driver/transport/trips` |
| Routing (provider) | `/api/transport/routing/*` |
| Live Traffic NSW (provider) | `/api/transport/traffic/*` |
| Trip Planner proxy (provider) | `/api/transport/tp/*` |

Responses include `permissions`, `nextActions`, optional `routeEstimate`, and role-shaped addresses (exact pickup/dropoff only for participant, consented nominee summary, provider org, assigned driver).

## Provider UI (control panel)

Signed-in providers use transport sections under `/provider/transport`:

| Route | Purpose |
|-------|---------|
| `/provider/transport` | Legacy bookings list |
| `/provider/transport/dispatch` | Dispatch board, suggestions, assign |
| `/provider/transport/fleet` | Dispatch fleet, verification, mobility features |
| `/provider/transport/runs` | Ride run pooling |

## Fleet verification APIs

| Method | Path |
|--------|------|
| GET/POST | `/api/provider/transport/drivers` |
| GET/PATCH | `/api/provider/transport/drivers/[driverId]` |
| PUT | `/api/provider/transport/drivers/[driverId]/verifications` |
| GET/POST | `/api/provider/transport/vehicles` |
| GET/PATCH | `/api/provider/transport/vehicles/[vehicleId]` |
| PUT | `/api/provider/transport/vehicles/[vehicleId]/verifications` |
| PUT | `/api/provider/transport/vehicles/[vehicleId]/features` |

## Driver APIs

| Method | Path |
|--------|------|
| GET | `/api/driver/transport/trips` |
| GET | `/api/driver/transport/trips/[tripId]` |
| POST | `/api/driver/transport/trips/[tripId]/status` |
| POST | `/api/driver/transport/trips/[tripId]/evidence` |

Evidence submission from `trip_completed` transitions the trip to `participant_review` for participant confirm/dispute.

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

# TfNSW Open Data (server-side key only)
TFNSW_API_KEY=
TFNSW_LIVE_TRAFFIC_ENABLED=true
TFNSW_TRIP_PLANNER_ENABLED=true
TFNSW_ENRICH_ROUTE_ESTIMATES=false
```

See [docs/tfnsw-traffic.md](docs/tfnsw-traffic.md) for hazard feeds, cameras, departures, and stop search.

## Consent

Nominee / family access requires active `transport.trip_access` consent from the participant.

## Routing

- Estimates are **advisory** (not guaranteed).
- Optimisation returns **suggestions** with `requiresHumanReview`; it does not auto-dispatch.
- Mock provider is default for local dev and tests.
- Optional `trafficAdvisory` on route estimates when `TFNSW_ENRICH_ROUTE_ESTIMATES=true` (open incidents near corridor; indicative only).

## Governance

- Status changes write `transport_trip_events` and `audit_events`.
- Sensitive trip detail reads write `data_access_logs`.

## NDIS

This module does not perform or imply NDIS payment approval.

## Accessible ride-sharing

Managed accessible transport and optional pooling: [docs/accessible-ride-share.md](docs/accessible-ride-share.md), [STRATEGY.md](STRATEGY.md).

```env
TRANSPORT_BOOKING_BRIDGE_ENABLED=false
TRANSPORT_RIDE_POOLING_ENABLED=false
```

## AV MCP (Cursor)

Autonomous Vehicle framework tools for agents: governance, trip transitions, suitability, advisory OSRM. See [docs/av-mcp.md](docs/av-mcp.md) and `.cursor/mcp.json` (`mapable-av` server).

```bash
npm run mcp:av
```

## Tests

```bash
npm test -- tests/transport-scheduling-routing.test.ts
npm test -- tests/tfnsw-traffic.test.ts
npm test -- tests/av-framework.test.ts
```
