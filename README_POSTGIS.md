# PostGIS strategy for MapAble

## Current state

- Provider service regions use `postcodes` and `suburbs` arrays on `ProviderServiceRegion`, with optional `geoJson` for future geometry.
- Place and directory search use Prisma filters until PostGIS is enabled on Neon.

## Enabling PostGIS (when ready)

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
ALTER TABLE "ProviderServiceRegion" ADD COLUMN IF NOT EXISTS geom geography(Polygon, 4326);
```

Use raw queries with `ST_Contains(geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326))` for distance sort.

## Fallback

`lib/provider/service-region-service.ts` → `regionCoversPostcode()` for non-PostGIS environments.
