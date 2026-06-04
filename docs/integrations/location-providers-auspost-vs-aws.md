# Location providers: Australia Post PAC vs AWS Location Service

MapAble needs suburb/postcode autocomplete, optional address validation, and maps. This document compares the two external options and recommends how to combine them.

## Summary recommendation

| Need | Recommended provider | Why |
|------|---------------------|-----|
| AU suburb + postcode autocomplete | **Australia Post PAC** (implemented) | Official AU postcode dataset; matches NDIS/provider search; already integrated |
| Interactive maps | **MapLibre** (existing) | Already in stack; tiles from `NEXT_PUBLIC_MAP_STYLE_URL` |
| Global geocode / POI / routing | **AWS Location** (optional later) | Strong for international or lat/lng routing; overlaps poorly with PAC for AU suburbs |
| Offline / seeded suburbs | **Local `searchable_locations`** (existing) | Fallback when PAC disabled or API fails |

**Do not replace AusPost PAC with AWS Places for Australian suburb search.** Use AWS only when you add non-AU addresses, place search ("café near me"), or route/isoline features.

## Australia Post PAC (current)

**Pros**

- Canonical Australian locality + postcode data
- Simple REST + `AUTH-KEY`; server-side proxy already at `/api/auspost/*`
- Postage calculator for future logistics features
- No AWS account or geo-places billing for basic suburb lookup

**Cons**

- Australia only
- Rate limits and key management (Vercel env)
- Not a full street-address geocoder (suburb/postcode level)

**Env**

```env
AUSPOST_PAC_API_KEY=...
AUSPOST_PAC_ENRICH_LOCATION_SEARCH=true
```

## AWS Amazon Location Service

**Pros**

- **Places**: Autocomplete, Geocode, ReverseGeocode, SearchText, SearchNearby
- **Routes**: CalculateRoutes, isolines, matrices
- **Maps**: MapLibre-compatible tiles via API key
- Good for multi-country expansion or precise coordinates

**Cons**

- Extra cost, API keys, IAM vs Places API key split
- AU suburb labels may differ from AusPost (validation mismatches for NDIS forms)
- Another dependency alongside PAC — two sources of truth for postcodes

**When to add**

- Provider/outlet geocoding on a map
- Drive-time isochrones for transport module
- Non-AU expansion

**Sketch env (not implemented)**

```env
AWS_LOCATION_ENABLED=false
AWS_LOCATION_API_KEY=
AWS_LOCATION_REGION=ap-southeast-2
AWS_LOCATION_ENRICH_LOCATION_SEARCH=false
```

## Architecture pattern (implemented)

```
User types in location field
        ↓
searchLocations() in location-autocomplete-adapter.ts
        ↓
  [if AUSPOST_PAC_ENRICH] → AusPost postcode search
        ↓ (empty or error)
  local searchable_locations (Prisma)
        ↓ (autocomplete API empty)
  static fallback catalog
```

Future AWS branch would sit **parallel to PAC**, not replace it:

```
if AWS_LOCATION_ENRICH && query looks like street address → AWS Autocomplete
else if AUSPOST_PAC_ENRICH → PAC
else → local DB
```

## Decision matrix

| Criterion | AusPost PAC | AWS Location Places |
|-----------|-------------|---------------------|
| AU postcode accuracy | Excellent | Good, not authoritative |
| Street-level address | Limited | Strong |
| Cost/complexity | Low | Medium |
| Already in MapAble | Yes (PR #153) | No |
| Agent-ready HTTP API | OpenAPI added | N/A until built |

## Next steps if adopting AWS

1. Register Places API key in AWS console (resourceless `geo-places:*` actions).
2. Add `lib/search/aws-location-adapter.ts` mirroring `LocationAutocompleteAdapter`.
3. Gate with `AWS_LOCATION_ENABLED` and **never** prefer AWS over PAC for pure AU suburb strings.
4. Use AWS **Routes** only from transport/scheduling features, not search autocomplete.

See also: [auspost-pac.md](./auspost-pac.md), [Amazon Location skill](/.cursor/plugins) for implementation patterns.
