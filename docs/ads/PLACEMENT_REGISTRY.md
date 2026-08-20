# Placement Registry

Canonical placement codes (see `lib/ads/placement-registry.ts`):

| Code | Surface | Map marker | External DOM |
|------|---------|------------|--------------|
| `access.map.sponsored-marker` | access | internal only | no |
| `access.map.sponsored-card` | access | no | yes |
| `access.map.bottom-sheet` | access | no | yes |
| `access.results.inline` | access | no | yes |
| `provider-finder.map.sponsored-card` | provider_finder | no | yes |
| `provider-finder.results.inline` | provider_finder | no | yes |
| `provider-finder.sidebar` | provider_finder | no | yes |

True map markers are created only by the internal provider. External networks render in controlled DOM slots that can visually belong to the map experience without injecting HTML into MapLibre markers.

Disclosure label: **Sponsored** (not Suggested / Featured / Recommended).
