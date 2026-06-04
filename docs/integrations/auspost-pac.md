# Australia Post PAC (Postage Assessment Calculator)

MapAble integrates the [Australia Post PAC & Postcode Search APIs](https://developers.auspost.com.au/apis/pac) for Australian suburb/postcode lookup and domestic parcel postage quotes.

## Credentials

1. Register at [Australia Post Developer Portal](https://developers.auspost.com.au/apis/pacpcs-registration).
2. Create an app credential with PAC / Postcode Search access.
3. Set the **32-character API key** on the server only (never in client bundles).

| Variable | Purpose |
|----------|---------|
| `AUSPOST_PAC_API_KEY` | Primary API key (sent as `AUTH-KEY` header) |
| `AUSPOST_API_KEY` | Alias for `AUSPOST_PAC_API_KEY` |
| `AUSPOST_PAC_ENABLED` | Set to `false` to disable all PAC calls (default: enabled when key present) |
| `AUSPOST_PAC_ENRICH_LOCATION_SEARCH` | Set to `true` to use PAC for search autocomplete locations (falls back to local DB) |
| `AUSPOST_PAC_DEFAULT_FROM_POSTCODE` | Optional default origin postcode for postage UI |
| `AUSPOST_PAC_CACHE_TTL_SECONDS` | In-memory cache TTL (default `3600`) |
| `AUSPOST_PAC_API_BASE_URL` | Override API host (default `https://digitalapi.auspost.com.au`) |

### Vercel (`mapableau-new`)

Add `AUSPOST_PAC_API_KEY` to **Production**, **Preview**, and **Development** in [project environment variables](https://vercel.com/map-able/mapableau-new/settings/environment-variables).

To enrich homepage/provider search locations from Australia Post:

```env
AUSPOST_PAC_API_KEY=<your-key>
AUSPOST_PAC_ENRICH_LOCATION_SEARCH=true
```

## API routes (server)

All routes proxy Australia Post over HTTPS with the server-side `AUTH-KEY`. Do not call Australia Post directly from the browser.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auspost/postcode/search?q=Melbourne&state=VIC` | Suburb/postcode search (`excludePostBox` optional, default true) |
| GET | `/api/auspost/postage/domestic/service` | List domestic parcel services for dimensions |
| GET | `/api/auspost/postage/domestic/calculate` | Calculate postage for a `serviceCode` |

### Postcode search example

```bash
curl -sS 'https://mapable.com.au/api/auspost/postcode/search?q=Parramatta&state=NSW'
```

### Domestic parcel service example

Query params: `fromPostcode`, `toPostcode`, `length`, `width`, `height`, `weight` (cm and kg).

```bash
curl -sS 'https://mapable.com.au/api/auspost/postage/domestic/service?fromPostcode=2000&toPostcode=3000&length=20&width=15&height=10&weight=1'
```

### Calculate example

Add `serviceCode` (from the service response), plus optional `optionCode`, `suboptionCode`, `extraCover`.

```bash
curl -sS 'https://mapable.com.au/api/auspost/postage/domestic/calculate?fromPostcode=2000&toPostcode=3000&length=20&width=15&height=10&weight=1&serviceCode=AUS_PARCEL_REGULAR'
```

## Code layout

| Path | Role |
|------|------|
| `lib/config/auspost-pac.ts` | Feature flags and env |
| `lib/auspost-pac/client.ts` | HTTPS GET + `AUTH-KEY` + cache |
| `lib/auspost-pac/postcode-search-service.ts` | Postcode search |
| `lib/auspost-pac/domestic-parcel-service.ts` | Services + calculate |
| `lib/search/auspost-location-adapter.ts` | Autocomplete adapter |
| `app/api/auspost/**` | Next.js route handlers |

## Security

- API keys must only exist in server environment variables.
- Postcode search is rate-limited per IP on `/api/auspost/postcode/search`.
- If a key is exposed (e.g. in chat or git), rotate it in the Developer Portal and update Vercel env.

## Tests

```bash
pnpm exec vitest run tests/auspost-pac.test.ts
```
