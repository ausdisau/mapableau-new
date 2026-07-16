# Civic Asset Registry

## Asset classes

`transport` · `pedestrian_realm` · `curb_parking` · `buildings_services` · `events` · `service_infrastructure`

See `lib/civic-access/types.ts` for the full `CivicAssetType` taxonomy.

## Required fields (Wave 1)

- `stableKey` (unique per organisation)
- `assetClass` / `assetType`
- `title`
- Optional `accessPlaceId` (soft reference to `AccessPlace.id` + `access_place:{id}` external ref; not a hard FK so synthetic pilot IDs are allowed)
- Optional geometry (never proves accessibility)
- `accessibilityClaims[]` with explicit states: unknown | asserted | evidenced | verified | stale | disputed | unavailable
- Source link requires at least one `CivicSourceLicence`

## APIs

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/civic/assets` | assets:read |
| POST | `/api/civic/assets` | assets:write |
| GET | `/api/civic/assets/[assetId]` | assets:read |
| GET | `/api/civic/assets/[assetId]/access` | projection:read |
| POST | `/api/civic/pilot/seed` | pilot:seed |

Flags off → **404** with `MAPABLE_CIVIC_DISABLED`.

## Canonical references

```
access_place:{id}
access_floor_plan:{id}
indoor_feature:{placeId}:{featureId}
transport_pickup:{id}
accessibility_ops_asset:{id}
```

Civic **never** creates a second AccessPlace row for an existing place.
