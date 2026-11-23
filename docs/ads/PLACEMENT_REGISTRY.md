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
| `explore.topic.sponsored-phrase` | public_explore | no | no (authored phrase only) |

True map markers are created only by the internal provider. External networks render in controlled DOM slots that can visually belong to the map experience without injecting HTML into MapLibre markers.

`explore.topic.sponsored-phrase` is a first-party authored sentence with one native sponsor link. Selection uses a closed route allowlist and a static editorial topic key only — never search query, draft text, AAC, profile, precise location, plan, account, map bounds, or selected provider. It does not call the placement/impression APIs; measurement and billing stay off for this pilot.

Disclosure label: **Sponsored** (not Suggested / Featured / Recommended). For the phrase pilot the visible disclosure is **Advertisement · Paid for by [payer]**.
