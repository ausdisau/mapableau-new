# Centralised mapping

MapAble maps share types, GeoJSON builders, entity mappers, and MapLibre configuration under `lib/map/`.

## Data sources

| Source | Used by | Coordinates |
|--------|---------|-------------|
| `public/data/provider-outlets.json` | Provider Finder list/grid (default) | Outlet `Latitude` / `Longitude` |
| `ndis_providers` (Postgres) | Ask, agent tools, optional map pins | `latitude` / `longitude` when ingested |
| `access_places` + `access_place_locations` | Access map UI | Per-place location row |
| `searchable_locations` | Autocomplete (no coords) | Geocoding hint only |

## Environment flags

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_MAP_STYLE_URL` | MapLibre demo tiles | Shared map style |
| `NEXT_PUBLIC_MAP_DEFAULT_LAT` / `LNG` / `ZOOM` | Sydney area | Default viewport |
| `MAP_INTEGRATION_ENABLED` | enabled | MapLibre integration health |
| `PROVIDER_FINDER_MAP_SOURCE` | `outlets` | `outlets` \| `ndis` \| `hybrid` map pins |
| `PROVIDER_FINDER_MAP_PIN_LIMIT` | `500` | Max pins per map response |
| `MAP_GEOCODING_NOMINATIM_ENABLED` | `false` | Server forward geocode fallback |
| `ACCESS_MAP_OVERLAY_ENABLED` | `false` | Future: access places on Finder map |

## API

- `GET /api/providers/ndis/search` — NDIS directory search (includes lat/lng when present).
- `GET /api/providers/map` — GeoJSON pins for Provider Finder when `PROVIDER_FINDER_MAP_SOURCE` is `ndis` or `hybrid`.

## Code layout

- `lib/map/types.ts` — `MapPointEntity`, feature property types
- `lib/map/geojson.ts` — `entitiesToGeoJSON`
- `lib/map/mappers/` — outlet, NDIS, access place → entities / Provider DTOs
- `lib/map/geocoding-service.ts` — suburb/postcode → coordinates
- `components/map/MapLibreMap.tsx` — Provider Finder map
- `components/access/AccessMapLayer.tsx` — Access map (shared style via `MapProvider`)

## Extension: access overlay on Finder

When `ACCESS_MAP_OVERLAY_ENABLED=true`, add a second GeoJSON source (`MAP_SOURCE_IDS.accessPlaces`) to `MapLibreMap` — not enabled in v1.
