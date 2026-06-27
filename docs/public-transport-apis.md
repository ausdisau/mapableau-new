# Public transport APIs (NSW, VIC, QLD, ACT, SA, WA, TAS, NT)

MapAble proxies Australian public transport open data on the server so API keys never reach the browser. A unified `/api/transport/pt/*` layer auto-detects jurisdiction from coordinates or accepts an explicit `jurisdiction` query parameter (`NSW|VIC|QLD|ACT|SA|WA|TAS|NT`).

## Jurisdictions

| State/Territory | Source | Trip planning | Stop search | Departures | Disruptions |
|-----------------|--------|---------------|-------------|------------|-------------|
| **NSW** | [TfNSW Trip Planner](https://opendata.transport.nsw.gov.au/dataset/trip-planner-apis) | Yes | Yes | Yes | Yes |
| **VIC** | [PTV Timetable API v3](https://www.vic.gov.au/public-transport-timetable-api) | Link-out only | Yes | Yes | Yes |
| **QLD** | [Translink GTFS/GTFS-RT/RSS](https://translink.com.au/about-translink/open-data) | Link-out only | Yes (GTFS) | Yes (GTFS + RT) | Yes (RSS + RT) |
| **ACT** | [Transport Canberra GTFS/GTFS-RT](https://anypoint.mulesoft.com/exchange/portals/act-government-9/) | Link-out only | Yes (GTFS) | Yes (GTFS + RT) | Yes (GTFS-RT alerts) |
| **SA** | [Adelaide Metro GTFS/GTFS-RT](https://www.adelaidemetro.com.au/developer-info) | Link-out only | Yes (GTFS) | Yes (GTFS + RT) | Yes (GTFS-RT alerts) |
| **WA** | [Transperth GTFS](https://www.transperth.wa.gov.au/About/Spatial-Data-Access) | Link-out only | Yes (GTFS) | Yes (schedule only) | No |
| **TAS** | [Tasmania GTFS](https://www.transport.tas.gov.au/public_transport/gtfs-data) | Link-out only | Yes (GTFS) | Yes (schedule only) | No |
| **NT** | [NT DLI GTFS](https://dli.nt.gov.au/data/bus-timetable-data-and-geographic-information) | Link-out only | Yes (GTFS) | Yes (schedule only) | No |

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

### ACT (Transport Canberra)

Register for a GTFS access key via the [Transport Canberra developer portal](https://anypoint.mulesoft.com/exchange/portals/act-government-9/). Basic auth uses an empty username and the access key as password.

```bash
ACT_GTFS_ENABLED=true
ACT_GTFS_ACCESS_KEY=
ACT_GTFS_URL=https://transport.api.act.gov.au/gtfs/data/gtfs/v2/google_transit.zip
ACT_GTFSRT_TRIP_UPDATES_URL=https://transport.api.act.gov.au/gtfs/data/gtfs/v2/trip-updates.pb
ACT_GTFSRT_ALERTS_URL=https://transport.api.act.gov.au/gtfs/data/gtfs/v2/service-alerts.pb
ACT_GTFS_REFRESH_HOURS=24
ACT_CACHE_TTL_SECONDS=120
```

### South Australia (Adelaide Metro)

No API key required for GTFS static or GTFS-RT feeds.

```bash
SA_GTFS_ENABLED=true
SA_GTFS_URL=https://gtfs.adelaidemetro.com.au/v1/static/latest/google_transit.zip
SA_GTFSRT_TRIP_UPDATES_URL=https://gtfs.adelaidemetro.com.au/v1/realtime/trip_updates
SA_GTFSRT_ALERTS_URL=https://gtfs.adelaidemetro.com.au/v1/realtime/service_alerts
SA_GTFS_REFRESH_HOURS=24
SA_CACHE_TTL_SECONDS=120
```

For SIRI stop monitoring and extended documentation, join the [Adelaide Metro Developer Group](https://groups.google.com/forum/#!forum/adelaide-metro-developer-group).

### Western Australia (Transperth)

Schedule-only GTFS; no public GTFS-RT feed.

```bash
WA_GTFS_ENABLED=true
WA_GTFS_URL=https://www.transperth.wa.gov.au/TimetablePDFs/GoogleTransit/Production/google_transit.zip
WA_GTFS_REFRESH_HOURS=24
```

Review PTA licence terms before production use.

### Tasmania

Statewide static GTFS; no public GTFS-RT developer feed.

```bash
TAS_GTFS_ENABLED=true
TAS_GTFS_URL=https://www.transport.tas.gov.au/__data/assets/file/0011/557615/GTFS_240425_Tasmania_post.zip
TAS_GTFS_REFRESH_HOURS=24
```

Update `TAS_GTFS_URL` from the [GTFS Data page](https://www.transport.tas.gov.au/public_transport/gtfs-data) when the download link changes.

### Northern Territory

Darwin and Alice Springs bus GTFS zips are merged automatically.

```bash
NT_GTFS_ENABLED=true
NT_GTFS_DARWIN_URL=https://dipl.nt.gov.au/data-feeds/bus-gtfs/google-transit-darwin.zip
NT_GTFS_ALICE_SPRINGS_URL=https://dipl.nt.gov.au/data-feeds/bus-gtfs/google-transit-alice-springs.zip
NT_GTFS_REFRESH_HOURS=24
```

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

Responses include `capabilities` so clients can degrade gracefully (e.g. show link-out for non-NSW jurisdictions).

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
- [Transport Canberra developer portal](https://anypoint.mulesoft.com/exchange/portals/act-government-9/)
- [Adelaide Metro developer info](https://www.adelaidemetro.com.au/developer-info)
- [Transperth Spatial Data Access](https://www.transperth.wa.gov.au/About/Spatial-Data-Access)
- [Tasmania GTFS Data](https://www.transport.tas.gov.au/public_transport/gtfs-data)
- [NT bus GTFS data](https://dli.nt.gov.au/data/bus-timetable-data-and-geographic-information)
- [PTV Timetable API Swagger](https://timetableapi.ptv.vic.gov.au/swagger/ui/index)
