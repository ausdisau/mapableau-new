# NDIS Pricing Intelligence Layer

MapAble abstracts manually imported NDIS Price Guide / Pricing Arrangements data into a reusable rules engine for quoting, invoicing, and claim **pre-checks**.

## Important limitations

- **No NDIS website scraping** — import CSV files you export yourself.
- **No auto-submit** — claim validation never sends data to the NDIA.
- **No funding approval** — results compare lines to your catalogue only; they are not eligibility or plan budget decisions.

## Data model

Historical catalogues are preserved via `NdisPriceCatalogue` + `NdisPriceCatalogueVersion` + `NdisSupportItemPrice`. Import jobs map to `NdisPriceImportJob` (catalogue imports audit trail).

Claim pre-checks persist as `NdisClaimValidationRun` and `NdisClaimValidationFinding`.

## APIs

| Method | Path | Access |
|--------|------|--------|
| POST | `/api/admin/ndis-pricing/import` | `ndis:pricing:manage` |
| GET | `/api/ndis-pricing/support-items` | Authenticated |
| GET | `/api/ndis-pricing/support-items/[code]` | Authenticated |
| POST | `/api/ndis-pricing/match-support-item` | Authenticated |
| POST | `/api/ndis-pricing/calculate-quote` | Authenticated |
| POST | `/api/ndis-pricing/validate-invoice-line` | Authenticated |
| POST | `/api/claim-validation/check-invoice/[invoiceId]` | `provider:ndia:claim` |

## Admin UI

`/admin/ndis-price-catalogue` — import form, lookup, quote preview, claim pre-check panel.

## Provider UI components

- `SupportItemSelector` — match by service type, provider type, description
- `QuoteLinePreview` — quote calculator with warnings
- `ClaimValidationPanel` — invoice pre-check (participant / provider / admin views)

## Environment

Set `NDIS_PRICING_IMPORT_ENABLED=true` (see `lib/config/phase5.ts`) to allow catalogue imports.

## CSV format

Minimum columns: `code`, `name`. Optional: price limit, unit, category, registration group, service types (pipe-separated), provider types.

XLSX files should be saved as CSV before upload.
