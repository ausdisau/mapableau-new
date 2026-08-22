# MapAble Ads Architecture

MapAble remains the **decision authority** for advertising. External networks supply optional inventory only.

```text
                         MapAble Ads
                              │
                 ┌────────────┴────────────┐
                 │                         │
          Placement Engine          Policy Engine
                 │                         │
                 └────────────┬────────────┘
                              │
                      Provider Router
                              │
          ┌───────────────────┼──────────────────┐
          │                   │                  │
     INTERNAL             GOOGLE            ETHICALADS
   MapAble Ads          Ad Manager            Adapter
```

## Module layout

- `lib/ads/` — placement registry, policy, ranking, mediation, privacy, measurement
- `lib/ads/auction/` — eCPM, CTR, quality, reserves, pacing, second-price auction
- `lib/ads/billing/` — prepaid wallet, ledger charge, Stripe top-up + webhook handlers
- `lib/ads/money/` — AUD micros helpers (Ads domain only)
- `lib/ads/providers/` — adapter implementations (internal, GAM, EthicalAds)
- `components/ads/mapable/` — Access/Finder sponsored UI (separate from marketing AdSense)
- `components/ads/` (root) — existing marketing footer AdSense path (coexists; unchanged)

## Commercial path (flag-gated)

```text
request → policy → eligibility → budget → pacing
       → quality × eCPM auction → reserve → AdAuctionResult
       → fill → view/click → billable event → ledger debit
```

MapAble Ads uses **prepaid funds**. Stripe handles advertiser funding. MapAble's internal ledger handles high-frequency ad charges. Bidding affects sponsored placements only. Accessibility and provider suitability cannot be purchased.

## Hard invariant

```text
advertisingRank
      !=
accessibilityScore
      !=
providerSuitabilityScore
      !=
organicSearchRank
```

Sponsored placement never changes MapAble accessibility evidence, accreditation, provider suitability or organic search ranking.

## Feature flags

All `MAPABLE_ADS_*` flags default **false**. Global kill switch: `MAPABLE_ADS_GLOBAL_KILL_SWITCH=true` → immediate `NO_AD`.

## No-fill is valid

Advertising must never block map use, accessibility data, Provider Finder, safety, or support functions.

## Geospatial targeting

There is **no PostGIS** in this repository. Campaign geometries are stored as JSON and evaluated in application code (`lib/ads/geo/campaign-geo.ts`).
