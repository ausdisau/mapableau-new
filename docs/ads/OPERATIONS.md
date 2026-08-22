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
MAPABLE_ADS_AUCTION_ENABLED=false
MAPABLE_ADS_BILLING_ENABLED=false
MAPABLE_ADS_STRIPE_TOPUPS_ENABLED=false
MAPABLE_ADS_GLOBAL_KILL_SWITCH=false
NEXT_PUBLIC_MAPABLE_ADS_ENABLED=false
NEXT_PUBLIC_MAPABLE_ADS_ACCESS_ENABLED=false
NEXT_PUBLIC_MAPABLE_ADS_PROVIDER_FINDER_ENABLED=false
GOOGLE_AD_MANAGER_NETWORK_CODE=
GOOGLE_AD_MANAGER_ACCESS_MAP_UNIT=
GOOGLE_AD_MANAGER_PROVIDER_FINDER_UNIT=
ETHICALADS_PUBLISHER_ID=
```

## Kill switches

| Scope | Mechanism |
|-------|-----------|
| Global | `MAPABLE_ADS_GLOBAL_KILL_SWITCH` or `MAPABLE_ADS_ENABLED=false` |
| Provider | env flag + `AdProviderConfig.enabled` |
| Campaign / advertiser | status `PAUSED` / `DISABLED` |
| Placement / surface | surface flags + `AdPlacement.status` |
| Auction delivery | `MAPABLE_ADS_AUCTION_ENABLED` (also blocked by global kill) |
| Billing charges | `MAPABLE_ADS_BILLING_ENABLED` |
| Stripe top-ups | `MAPABLE_ADS_STRIPE_TOPUPS_ENABLED` |

Webhook reconciliation for Ads top-ups may still settle when delivery flags are off.

## Seed

```bash
pnpm exec tsx prisma/seed-ads-foundation.ts
```

Synthetic fixtures only — no real provider or participant data.

## Admin

`/admin/ads` — flags, advertisers, campaigns, creatives, **Auction**, **Pricing**, **Payments**, **Wallets**, **Ledger**.

Advertiser UI: `/provider/ads` (org-scoped).

## Financial ops notes

- Prepaid deposits ≠ recognized ad revenue until accounting review.
- Manual wallet adjustments require reason + audit event.
- Disputes / over-refunds freeze wallets and pause paid campaigns.

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
