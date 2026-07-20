# Provider Service-Area Engine

**Status:** synthetic contracts — flags default **false**  
**Production claim:** none

## Separation of concerns

| Concept                        | Meaning                              |
| ------------------------------ | ------------------------------------ |
| Geographic coverage            | Provider states the area is in-scope |
| Capacity                       | limited_capacity / waitlist / etc.   |
| Live availability              | confirmed / unknown / stale          |
| Worker / vehicle compatibility | Out of band — hard requirements note |

Payment or advertising status must **never** improve compatibility ranking.

## Flags

- `MAPABLE_PROVIDER_SERVICE_AREAS_ENABLED=false`
- `MAPABLE_SERVICE_AREA_MAP_ENABLED=false`

## APIs

- `GET /api/providers/service-areas?postcode=&lat=&lng=`
- `GET /api/providers/[providerId]/service-areas`
- `POST /api/providers/service-areas` → 501 until persistence wave

## UI requirements (when map flag on)

Every map must ship a complete list alternative (`listAlternative` in the GET response).
