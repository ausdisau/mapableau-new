# NDIS provider finder data ingestion

MapAble loads provider map pins from the official NDIS **list-providers** extract used by the [NDIS provider finder](https://www.ndis.gov.au/provider-finder).

**Source URL:**

`https://www.ndis.gov.au/sites/default/files/react_extract/provider_finder/build/data/list-providers.json`

## Outputs

| File | Purpose |
|------|---------|
| `public/data/provider-outlets.json` | Full outlet records (`{ date, data: ProviderOutlet[] }`) for search and list |
| `public/data/provider-outlets-map.json` | Slim coordinate index generated at ingest (optional CDN mirror) |

## Ingest commands

```bash
# Try direct download (may be blocked by Cloudflare from CI/datacenters)
pnpm ingest:ndis-providers

# Recommended: save JSON from the URL in a browser, then:
pnpm ingest:ndis-providers --input ./list-providers.json

# Regenerate map pin index from existing outlets file
pnpm ingest:ndis-providers --refresh-map-only
```

## Provider map API

The provider finder map uses server-side filtering so the browser does not load the full ~45MB JSON:

`GET /api/ndis/providers/map?lat=&lng=&radiusKm=50&state=NSW&q=therapy&limit=500`

Returns `{ success, date, totalMatched, providers }` with lat/lng from the NDIS extract.

## Attribution

Provider register data is © NDIS. MapAble displays it for discovery; verify details with providers before engaging services.
