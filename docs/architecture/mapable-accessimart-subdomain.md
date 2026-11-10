# AccessiMart subdomain architecture

Status: development / draft PR — do not attach production DNS until review.

Target public host: `https://accessimart.mapable.com.au`

## Purpose

Public AccessiMart / Marketplace **programme** entry on a distinct origin, without enabling commerce.

## Routing

Handled in middleware via `lib/marketplace/accessimart-host-routing.ts`:

- `accessimart.mapable.com.au/` rewrites to `/marketplace`
- `accessimart.mapable.com.au/<path>` rewrites to `/marketplace/<path>`
- explicit `/marketplace/*` remains reachable on the main host
- API and static-asset requests are not rewritten

Override host with `MAPABLE_ACCESSIMART_HOST`.

## Safety

- This adapter does **not** enable `MAPABLE_ACCESSIMART_REVIEW_ENABLED` or transactional shop flags.
- Review storefront (`/marketplace/accessimart-review`) stays independently flag- and allowlist-gated.
- No payments, supplier feeds, or invoice creation are activated by the subdomain.

## Vercel

Attach `accessimart.mapable.com.au` only after preview CI and accessibility review.
