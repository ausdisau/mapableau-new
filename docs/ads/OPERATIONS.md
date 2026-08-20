# MapAble Ads Operations

## Flags (all default false)

```env
MAPABLE_ADS_ENABLED=false
MAPABLE_ADS_ACCESS_ENABLED=false
MAPABLE_ADS_PROVIDER_FINDER_ENABLED=false
MAPABLE_ADS_INTERNAL_ENABLED=false
MAPABLE_ADS_GOOGLE_ENABLED=false
MAPABLE_ADS_ETHICALADS_ENABLED=false
MAPABLE_ADS_MEASUREMENT_ENABLED=false
MAPABLE_ADS_MANAGER_ENABLED=false
MAPABLE_ADS_GLOBAL_KILL_SWITCH=false
NEXT_PUBLIC_MAPABLE_ADS_ENABLED=false
NEXT_PUBLIC_MAPABLE_ADS_ACCESS_ENABLED=false
NEXT_PUBLIC_MAPABLE_ADS_PROVIDER_FINDER_ENABLED=false
NEXT_PUBLIC_MAPABLE_ADS_MANAGER_ENABLED=false
GOOGLE_AD_MANAGER_NETWORK_CODE=
GOOGLE_AD_MANAGER_ACCESS_MAP_UNIT=
GOOGLE_AD_MANAGER_PROVIDER_FINDER_UNIT=
ETHICALADS_PUBLISHER_ID=
```

## Kill switches

| Scope | Mechanism |
|-------|-----------|
| Global | `MAPABLE_ADS_GLOBAL_KILL_SWITCH` or `MAPABLE_ADS_ENABLED=false` |
| Ad Manager portal | `MAPABLE_ADS_MANAGER_ENABLED=false` |
| Provider | env flag + `AdProviderConfig.enabled` |
| Campaign / advertiser | status `PAUSED` / `DISABLED` |
| Placement / surface | surface flags + `AdPlacement.status` |

## Seed

```bash
pnpm exec tsx prisma/seed-ads-foundation.ts
```

Synthetic fixtures only — no real provider or participant data.

## Admin

`/admin/ads` — flag status, advertisers, campaigns, creatives.
`/admin/ads/reviews` — human vetting queue (approve / reject / activate).

## Advertiser portal

See [AD_MANAGER.md](./AD_MANAGER.md). Provider console: `/provider/ads` (requires manager flag).

## CSP additions (documented)

Added for GPT / EthicalAds (only needed when those adapters are enabled):

| Directive | Origin |
|-----------|--------|
| script-src | `https://securepubads.g.doubleclick.net`, `https://media.ethicalads.io` |
| connect-src | `https://securepubads.g.doubleclick.net`, `https://*.doubleclick.net`, `https://server.ethicalads.io`, `https://media.ethicalads.io` |
| img-src | `https://media.ethicalads.io` |

Existing AdSense/`googlesyndication` origins were already present. Do **not** use `script-src *` or blanket `unsafe-eval` for advertising.

## Rollback

Disable all `MAPABLE_ADS_*` / `NEXT_PUBLIC_MAPABLE_ADS_*` flags. Access and Provider Finder behave as before. Migrations are additive and backwards compatible.
