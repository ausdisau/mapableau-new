# MapAble Ads Pricing

## Currency

Ads prepaid accounting uses **AUD micros** only inside the Ads domain:

- `1 AUD = 1_000_000` micros
- `1 cent = 10_000` micros

Example: A$18 CPM = `18_000_000` micros CPM; one impression at that CPM = `18_000` micros (A$0.018).

This is **not** a global assumption for other MapAble billing domains.

## Placement reserve floors (development defaults)

| Placement | Floor CPM |
|-----------|-----------|
| `access.map.sponsored-marker` | A$16 |
| `access.map.sponsored-card` | A$18 |
| `access.map.bottom-sheet` | A$18 |
| `access.results.inline` | A$20 |
| `provider-finder.map.sponsored-card` | A$24 |
| `provider-finder.results.inline` | A$28 |
| `provider-finder.sidebar` | A$24 |

Resolved centrally by `getPlacementReservePrice()`. Operator overrides use `AdPlacementRule` with `ruleKey=floor_cpm_micros`.

Changing floors must **not** modify accessibility ranking, provider suitability, or organic results.

## Advertiser messaging

- “You will never be charged more than your maximum bid.”
- “Actual price may be lower depending on competing eligible ads and MapAble placement reserve prices.”
- Impression volume is not guaranteed.

## Auction increment

Default `AUCTION_INCREMENT_MICROS = 10_000` (A$0.01 CPM).
