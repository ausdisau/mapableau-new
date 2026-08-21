# MapAble Ads Auction

MapAble runs a **quality-adjusted second-price auction** over MapAble-owned inventory only.

## Order of gates

```text
POLICY → ELIGIBILITY → BUDGET → PACING → AUCTION
```

Advertising spend cannot override policy eligibility.

## Bid models

| Model | Meaning |
|-------|---------|
| CPM | Bid is max cost per 1,000 viewable impressions |
| CPC | Bid is max cost per valid click |
| HOUSE | MapAble promotion; charge = 0; monetary non-competitor |

## Normalised currency (eCPM)

- CPM: `rawEcpm = maxCpm`
- CPC: `rawEcpm = maxCpc × predictedCTR × 1000`

Money uses **AUD micros** (`1 AUD = 1_000_000` micros).

## Quality

`qualityScore` is bounded (~0.5–1.5 as milli 500–1500).

```text
effectiveAuctionScore = rawEcpm × qualityScore
```

Quality may use aggregate contextual signals. It **must not** use disability, diagnosis, NDIS, AAC, clinical history, participant identity, accessibility score, or provider suitability.

## Second-price clearing

Winner = highest `effectiveAuctionScore`.

```text
runnerUpEquivalent = runnerUpEffective / winnerQuality
clearingEcpm = min(
  winnerRawEcpm,
  max(placementReserve, runnerUpEquivalent + auctionIncrement)
)
```

If no runner-up: `clearingEcpm = placementReserve` (if winner meets reserve).

CPC winners compete on eCPM but pay:

```text
clearingCpc = clearingEcpm / (predictedCTR × 1000)
  capped at advertiser max CPC
```

Both `auctionEcpmMicros` and `clearingUnitPriceMicros` are stored on `AdAuctionResult`.

## Algorithm version

`mapable-qa-second-price-v1` (`AUCTION_ALGORITHM_VERSION`).

## External mediation

Internal auction returns an internal fill or no eligible paid/house bid. Existing mediation may then try GAM / EthicalAds / no-fill. Fake GAM prices are **not** compared in the internal auction.

## Feature flag

`MAPABLE_ADS_AUCTION_ENABLED` (default `false`). Global kill switch also disables delivery.
