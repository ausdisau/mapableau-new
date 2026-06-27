# Public transport APIs (NSW, VIC, QLD)

MapAble proxies Australian public transport open data on the server so API keys never reach the browser. A unified `/api/transport/pt/*` layer auto-detects jurisdiction from coordinates or accepts an explicit `jurisdiction=NSW|VIC|QLD` query parameter.

## Jurisdictions

| State | Source | Trip planning | Stop search | Departures | Disruptions |
|-------|--------|---------------|-------------|------------|-------------|
| **NSW** | [TfNSW Trip Planner](https://opendata.transport.nsw.gov.au/dataset/trip-planner-apis) | Yes | Yes | Yes | Yes |
| **VIC** | [PTV Timetable API v3](https://www.vic.gov.au/public-transport-timetable-api) | Link-out only | Yes | Yes | Yes |
| **QLD** | [Translink GTFS/GTFS-RT/RSS](https://translink.com.au/about-translink/open-data) | Link-out only | Yes (GTFS) | Yes (GTFS + RT) | Yes (RSS + RT) |

NSW-specific legacy routes remain at `/api/transport/tp/*`.

## Setup

### NSW (TfNSW)

Register at the [TfNSW Open Data Hub](https://opendata.transport.nsw.gov.au/) and create an application API key.

```bash
TFNSW_API_KEY=your_production_key
TFNSW_TRIP_PLANNER_ENABLED=true
TFNSW_LIVE_TRAFFIC_ENABLED=true
```

Auth header: `Authorization: apikey {YOUR_KEY}`.

See also [docs/tfnsw-traffic.md](tfnsw-traffic.md) for Live Traffic NSW.

### Victoria (PTV)

Email **APIKeyRequest@ptv.vic.gov.au** with subject `PTV Timetable API – request for key` to obtain a developer ID and private key.

```bash
PTV_DEV_ID=
PTV_API_KEY=
PTV_TIMETABLE_ENABLED=true
```

Each request is signed with HMAC-SHA1. PTV does not provide a REST journey planner — use stop search, departures, and disruptions, or link users to [ptv.vic.gov.au/journey](https://www.ptv.vic.gov.au/journey/).

### Queensland (TransLink)

No API key required for GTFS static or RSS feeds.

```bash
TRANSLINK_GTFS_ENABLED=true
TRANSLINK_GTFS_URL=https://gtfsrt.api.translink.com.au/GTFS/SEQ_GTFS.zip
TRANSLINK_GTFS_REFRESH_HOURS=24
TRANSLINK_GTFSRT_TRIP_UPDATES_URL=https://gtfsrt.api.translink.com.au/api/realtime/SEQ/TripUpdates
```

GTFS zip is cached in memory and refreshed periodically. On Render free tier the cache resets on cold start.

## Unified API routes

All routes require `transport:read:org` **or** `transport:read:self` (participants and operators).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/transport/pt/capabilities?lat=&lng=` | Jurisdiction + capability flags |
| GET | `/api/transport/pt/stops/search?query=&jurisdiction=` | Stop / address search |
| GET | `/api/transport/pt/coord?lat=&lng=` | Stops near coordinates |
| GET | `/api/transport/pt/departures?stopId=&jurisdiction=` | Departure board |
| GET | `/api/transport/pt/disruptions?jurisdiction=` | Service alerts / disruptions |
| GET | `/api/transport/pt/trip?originLat=&originLng=&destinationLat=&destinationLng=&wheelchair=` | Multi-leg trip plan (NSW only) |

Responses include `capabilities` so clients can degrade gracefully (e.g. show link-out for VIC/QLD).

### NSW legacy routes

| Method | Path |
|--------|------|
| GET | `/api/transport/tp/stops/search` |
| GET | `/api/transport/tp/departures` |
| GET | `/api/transport/tp/coord` |
| GET | `/api/transport/tp/alerts` |
| GET | `/api/transport/tp/trip` |

## UI

- Trip detail page (`/dashboard/transport/[tripId]`) shows `PublicTransportPanel` when pickup coordinates are available.
- Wheelchair-only filtering defaults on when the trip has `requiresWheelchairAccessible` mobility requirements (NSW).

## Governance

- All PT data is **indicative**; follow official signage and operator advice.
- TfNSW On Demand legs (iconId 23) are labelled only — do not draw route shapes for on-demand segments per TfNSW terms.
- Opal fare data was removed from TfNSW Trip Planner in October 2023 — do not rely on fare fields.
- Respect each provider's terms of use and CC attribution.

## References

- [TfNSW Trip Planner APIs](https://opendata.transport.nsw.gov.au/dataset/trip-planner-apis)
- [Transport Victoria Open Data](https://opendata.transport.vic.gov.au/)
- [Translink Open Data](https://translink.com.au/about-translink/open-data)
- [PTV Timetable API Swagger](https://timetableapi.ptv.vic.gov.au/swagger/ui/index)
