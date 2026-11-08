# Ads Manager design contracts

These files are **proposed design contracts**, not proof of production endpoints or partner rights.

| File | Purpose |
|------|---------|
| `mapable_ads_placement_openapi_v1_2.yaml` | OpenAPI 3.1 for `/api/ads/v1` placement planning and orders |
| `mapable_ads_provider_registry_v1_2.json` | Seed provider registry; every `production_enabled` / `live_spend_enabled` flag is false |

Implementation mounts under the Next app as `/api/ads/v1/*`. Do not treat APIs.io catalogue rows as authorised buying surfaces.
