# Transport OSM dispatch module

OpenStreetMap-based accessible transport booking, routing, and dispatch for MapAble.

## Architecture

- **Private data** (addresses, access needs, notes): PostgreSQL via Prisma (`TransportBooking`, `StoredLocation`).
- **Public map/routing**: MapLibre + OSM tiles; geocoding via Nominatim; routing via pluggable providers (MVP: OpenRouteService, fallback: haversine placeholder).
- **Status changes**: Always go through `transitionTripStatus()` in `lib/transport-osm/trip-status-service.ts`, which writes `DispatchEvent` and audit logs.

## Environment

```bash
ORS_API_KEY=                    # OpenRouteService key (optional)
ROUTE_PROVIDER=openrouteservice   # openrouteservice | valhalla | opentripplanner | disabled
TRANSPORT_ROUTING_ENABLED=true
NOMINATIM_USER_AGENT=MapAbleAU-Transport/1.0
MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
```

PostGIS: migration enables `postgis` when available; `StoredLocation` uses `lat`/`lng` for Prisma CRUD.

## APIs

| Route | Purpose |
|-------|---------|
| `POST /api/transport/bookings` | Create trip (required access fields) |
| `POST /api/transport/quotes` | Generate quote + route |
| `POST /api/transport/bookings/[id]/confirm-quote` | Participant confirms |
| `PATCH /api/transport/bookings/[id]/status` | Lifecycle transition |
| `GET /api/transport/dispatch/recommendations` | Ranked assign options |
| `POST /api/transport/dispatch/assign` | Manual dispatch |
| `GET /api/transport/dispatch/live` | Active trips for map |
| `POST /api/transport/[id]/tracking/location` | Driver GPS point |
| `GET/POST /api/transport/bookings/[id]/messages` | Trip thread |
| `POST /api/transport/care-bundle` | Care + transport bundle |

## UI

- Participant: `/dashboard/transport/new`, `/dashboard/transport/[id]`
- Dispatch: `/admin/dispatch`, `/provider/transport/dispatch`
- Driver: `/driver/trips/[id]`

## Swapping routing providers

Implement `RoutingProvider` in `lib/transport-osm/routing/` and register in `getRoutingProvider()` (`lib/transport-osm/routing/index.ts`). Set `ROUTE_PROVIDER` accordingly.

## Privacy

Do not send disability support notes or full addresses to OSM edit APIs. Only coordinates or geocode queries are sent to Nominatim/ORS; results are cached in MapAble’s database.
