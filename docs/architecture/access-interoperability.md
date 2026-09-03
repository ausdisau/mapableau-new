# Access interoperability

## Public projection

`lib/access/interop/` projects observations to `PublicAccessFeature` without:

- AccessPassport / diagnosis / health / NDIS
- contributor identity
- home address / private routes / private preferences

## JSON-FG evolution

Internal storage is unchanged. The public projection is GeoJSON-shaped and designed to evolve toward JSON-FG / OGC API – Features without rewriting GAIS.

Flag: `MAPABLE_ACCESS_JSON_FG_API_ENABLED` (also activates via `MAPABLE_PUBLIC_ACCESS_INTEROP_API_ENABLED`).

## Attribution

Source attribution registry lives in `lib/access/interop/attribution.ts`.

## Overture licences (evaluated)

- Places: CDLA Permissive 2.0 / Apache 2.0 (source-specific)
- Transportation: ODbL (includes OSM) — share-alike obligations apply if redistributed

Overture schema is never copied into GAIS. External IDs (e.g. GERS) may be preserved on base-geography features only.
