# MapAble Inclusive Marketplace pilot v1 — Technical architecture and delivery gates

**Status:** synthetic working software, draft review only. Not production commerce.
**Audience:** disabled people, carers/chosen supporters, support coordinators, suppliers and disability-owned businesses.
**Brand:** MapAble — Find access. Drive change. The public utility remains separate from paid services.

## Existing foundations retained
- Next.js / React / TypeScript / Tailwind, existing authentication and role infrastructure.
- Route placed beneath /marketplace/browse and inherits the existing Marketplace shop layout authentication and MAPABLE_MARKETPLACE_ENABLED default-off feature flag.
- Core retains identity, consent, support, audit and billing ownership. This pilot does NOT create an NDIS digital platform service or accept payments.
- The previously merged evidence-first demo and draft PR #640 may be reconciled later. This implementation adds a separate route to avoid unreviewed merges.

## Working vertical slice
1. Accessible search of synthetic physical goods, rentals, digital products, reuse and services.
2. Filter by function (communication, mobility, dexterity, vision, sensory, cognition, remote) without diagnosis or NDIS data.
3. Inspect seller-stated evidence and unknowns, and compare up to three listings.
4. Add up to eight listings to a local planning basket. Restricted products are excluded; high-risk items remain information-only.
5. Preview approximate example amounts via authenticated POST /api/marketplace/estimate-preview. Server accepts item IDs and quantities only; resolves prices against the canonical synthetic catalogue. Unknown prices and specialist-review items cannot produce a total.
6. Download a local enquiry draft. No email, contact record, quote, invoice, order, live stock change or payment is generated.
7. Draft seller/service listings locally; no real supplier onboarding or claims of disability ownership.
8. Choose participant, supporter or support-coordinator guidance modes. MODE SWITCH IS NOT AUTHORIZATION and never grants delegated account access.

## Client and server boundary

- packages/marketplace-inclusive/src/index.ts: portable types, seed fixtures, deterministic filter, estimate validation, legacy billing guard and draft export.
- components/marketplace/InclusiveMarketplace.tsx: React storefront and local vendor draft.
- app/marketplace/(shop)/browse/inclusive/page.tsx: authenticated default-off noindex route.
- app/api/marketplace/estimate-preview/route.ts: requireApiSession + Year-One feature gate + strict validation + same-origin + size limits; returns no-store, nonbinding preview; no persistence.
- app/api/billing/invoices/route.ts: explicitly denies legacy marketplace invoices and obvious marketplace item metadata, preventing new client-price shopping invoices through that generic endpoint.
- components/marketplace/MarketplaceClient.tsx: replaces the old client-price invoice checkout with a disabled/non-actionable message. No payment mutation.
- app/marketplace/(shop)/cart/page.tsx: labels existing cart as example-only.
- app/marketplace/(shop)/layout.tsx: links to the new pilot within the gated shop navigation.

## Product data future schema
Listing: id, vendorOrgId, kind, category, accessFeatures, seller evidence/provenance, condition, serial/ownership (restricted), verificationAt, conditionAt, stock, productSafetyCategory, recall status, licence, warranty, GST/tax status, shipping, return terms and review stage.
MarketplaceQuote: subjectUserId, allowed delegateGrant scope, product IDs, variant IDs, quantity, server price snapshot, tax/shipping snapshot, seller inventory lock, quote expiry, audit event, participant confirmation, currency.
Order: orderId, quoteId, source actor, principal participant, consent receipt, merchant-of-record, seller contracts, order state machine, payment intent, dispute/refund state, delivery evidence. This is a SCHEMA PROPOSAL only. No migration is included.

## Care and coordination roles
Participant owns decisions. A carer, family member or support coordinator may research with the participant but MUST NOT gain delegated permissions through changing a screen mode. The live service needs purpose-bound account delegation with expiry and revocation, logged access, case-specific consent and participant-owned confirmation. Support coordination must be separated from seller incentives and care provision conflicts.

## No-go for checkout
The older cart previously sent user-supplied unitAmountCents, GST and NDIS item metadata to POST /api/billing/invoices, where createDraftInvoice trusts submitted line items. This slice closes that specific marketplace path while leaving unrelated Care/Transport/Jobs invoicing unchanged. A production order service must accept *only* trusted IDs/quantities and prove product, stock, supplier, taxation, contract, ownership, safety, NDIS context and payment authorization server-side. Do not bypass by labelling an invoice "other". Independent security and accounting review required.

## Release testing
- pnpm exec vitest run tests/marketplace-inclusive.test.ts
- pnpm type-check
- Scoped ESLint and Prettier
- pnpm build
- Authenticated Playwright search, comparison, estimates and seller-draft tests.
- Manual testing for keyboard, AAC/switch, VoiceOver, TalkBack, 200–400% zoom, 44px target preference, reduced motion, screen reader announcements, low literacy, interrupted-session recovery and safe error handling. Test participant and supporter experiences with disabled users.
- Confirm API returns 404 with feature OFF, 401 without session, 403 cross-site, 400 invalid body, 422 duplicate/restricted item and 200 only with approved synthetic input.
- Do not claim WCAG compliance from static checks alone.

## Regulatory and operational approvals BEFORE live operations
The NDIS Quality and Safeguards Commission mandatory-registration pathway applies to in-scope NDIS digital platform services from 1 July 2026. Obtain formal classification of the ACTUAL service model before arranging NDIS-funded support brokerage or payment. Goods marketplace vs care service marketplace boundaries matter.
Australia's Consumer Law: seller identity, product safety, refunds/returns, recalls, misleading representations, merchant-of-record and disputes.
TGA: identify regulated medical device types and lawful supply pathway.
NDIA: low/mid/high AT prices are NOT a safety test or automatic fundability. Separate product assessment from NDIS funding decision.
Privacy: no diagnosis/plan info required for browsing; collect minimum info under informed consent, no paid ranking based on disability data; separate marketing from service.
Existing security debt and Vercel account restrictions remain separate release blockers.

## Delivery next
1. Review and merge only after human approval of this draft and focused CI.
2. Reconcile pending PR #640 accessibility improvements and other security PRs without overwriting changes.
3. Extend schema with vendor approval, real inventory and provenance; accessible complaints and human service recovery.
4. Build server quote + order state machine with consent and regulated boundaries; product-specific human validation.
5. Add licensed payments, settlement/refund/chargeback reconciliation, then independent AT and security acceptance, then controlled pilot.
6. Enable transactions ONLY after a separate explicit go-live decision.

## Sources
- MapAble repository / app/marketplace/(shop)/layout.tsx and lib/config/year-one-scope.ts, inspected 31 October 2026.
- https://www.ndiscommission.gov.au/about-us/ndis-commission-reform-hub/mandatory-registration
- https://www.ndis.gov.au/participants/assistive-technology/types-assistive-technology/what-low-cost-assistive-technology
- https://www.ndis.gov.au/participants/assistive-technology/types-assistive-technology/what-mid-cost-or-high-cost-assistive-technology
- https://www.w3.org/TR/WCAG22/
- Australian Consumer Law and product safety ACCC obligations require review before live sales.
