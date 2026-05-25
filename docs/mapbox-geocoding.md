# Mapbox Geocoding API

MapAble uses the [Mapbox Geocoding API](https://docs.mapbox.com/api/search/geocoding/) server-side for Australian location autocomplete and reverse geocoding (e.g. “Use my location” in provider finder).

## Configuration

Set in Vercel / `.env.local` (never commit real tokens):

```bash
MAPBOX_ACCESS_TOKEN=pk.eyJ...
# MAPBOX_GEOCODING_ENABLED=false   # force off even with token
# MAPBOX_GEOCODING_COUNTRY=au      # default Australia
```

When `MAPBOX_ACCESS_TOKEN` is set and geocoding is enabled:

- Location autocomplete merges Mapbox forward results with `searchable_locations`.
- `GET /api/geocoding/reverse` uses Mapbox reverse geocode.
- Browser code calls `/api/geocoding/reverse` via `reverseGeocodeViaApi()` in `lib/geo.ts`.

Without a token, behaviour falls back to local DB locations and Nominatim reverse geocode on the server only.

## API routes

| Route | Purpose |
|-------|---------|
| `GET /api/geocoding/forward?q=&limit=` | Forward geocode (Mapbox only) |
| `GET /api/geocoding/reverse?lat=&lng=` | Reverse geocode (Mapbox or Nominatim fallback) |

Location suggestions also flow through `GET /api/search/autocomplete` when `field=location` or `field=all`.

## Privacy

- Geocoding runs on the server; the access token is not exposed to the client.
- Autocomplete and geocode requests are rate-limited per IP.
- No NDIS, clinical, or payment data is sent to Mapbox.

## Attribution

If you display Mapbox-derived results on a map using Mapbox tiles, follow [Mapbox attribution requirements](https://docs.mapbox.com/help/getting-started/attribution/).
