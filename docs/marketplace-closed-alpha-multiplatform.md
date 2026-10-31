# MapAble Marketplace — closed alpha, cross-platform

Status: development code on a stacked draft branch, not deployed, not live commerce.

## Dependency map
Base: draft PR #642 -> draft PR #641 -> main. PR #640 accessibility refinements and #643 PayCore need independent review and reconciliation.

## Alpha
- Next.js route: `/marketplace/browse/closed-alpha`. Inherits authenticated default-off `MAPABLE_MARKETPLACE_ENABLED` shop gate.
- Portable source contract: `packages/marketplace-inclusive/src/alpha-catalogue.ts`.
- All listings, sellers, illustrative prices and stock/safety labels synthetic.
- Local selection and enquiry preview only: no invoice, booking, checkout, PSP, database mutation, actual refunds, payout or claims.
- No demographic ranking or paid/sponsored preference. Unknown verification remains visible.

## Mobile
The separately installed Expo companion is not modified here: the portable domain can be imported after the app's SDK security baseline and privacy/identity boundaries are reviewed. A future independent native screen should consume the same pure contracts but not embed Stripe secret keys.

## Open-data transition
Wikidata structured data is CC0 and may seed categories and non-commercial descriptors, but does not prove seller ownership, availability, price, product safety, tax, warranty, NDIS eligibility or stock. Treat ISO 9999 as reference-only: it is not an open product catalogue. External ingestion must require `stage=open-beta`, explicit source allowlist, a separate server feature flag, licence capture, human review, moderation, deduplication, source freshness and takedown. Fail closed.

## Stripe boundary
Stripe was not connected or invoked. Test-mode Checkout/Connect requires separate human-reviewed server-authoritative pricing, authentication and tenant scoping; webhook signature verification, livemode rejection, durable event replay/idempotency, source-validated invoices and reconciliation. Existing draft PayCore PR #643 identifies unresolved flaws. No production payout, charge, claim or refund authorisation exists.

## Verification to perform on exact head
`pnpm exec vitest run tests/marketplace-closed-alpha.test.ts`
`pnpm type-check`
`pnpm exec eslint packages/marketplace-inclusive/src/alpha-catalogue.ts components/marketplace/MarketplaceClosedAlpha.tsx "app/marketplace/(shop)/browse/closed-alpha/page.tsx" tests/marketplace-closed-alpha.test.ts --max-warnings 0`
`pnpm exec prettier --check packages/marketplace-inclusive/src/alpha-catalogue.ts components/marketplace/MarketplaceClosedAlpha.tsx "app/marketplace/(shop)/browse/closed-alpha/page.tsx" tests/marketplace-closed-alpha.test.ts`
Plus CI, Playwright, screen-reader, switch/AAC, reflow 200–400%, and participant-led human tests. DO NOT merge/deploy/enable prior to approval.
