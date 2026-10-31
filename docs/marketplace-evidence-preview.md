# Marketplace evidence-first preview — draft-only integration

**Target:** ausdisau/mapableau-new
**Source:** MapAble Marketplace TypeScript Architecture, 31 October 2026
**Branch:** feat/marketplace-evidence-preview-20261031
**Status:** synthetic test surface, NOT a live shop.

## Scope and user value

A participant can compare equipment evidence without giving their diagnosis, NDIS funding details, location or contact information. Field-level statements show their source, while missing measurements, seller verification, delivery and warranty remain visibly unknown. The user can compare up to three examples and export a *local-only* text draft for lower-risk examples.

The implementation is portable TypeScript plus Next.js client components, not a new order or billing service.

## Keep

- app/marketplace/(public)/page.tsx (existing informational explainer).
- app/marketplace/(shop)/layout.tsx (requireAuth + enforceYearOneModulePath("/marketplace/browse")).
- lib/config/year-one-scope.ts (MAPABLE_MARKETPLACE_ENABLED remains default OFF).
- Existing production and legacy catalogue, checkout, and Stripe services are NOT modified.
- MapAble Core identity, consent, audit and payment boundaries stay authoritative.

## Add / Update / Wire together

- ADD packages/marketplace-evidence/src/index.ts: portable evidence types, risk gates, synthetic fixtures, deterministic search and local draft formatting.
- ADD components/marketplace/MarketplaceEvidencePreview.tsx: accessible, comparison-first client demonstration.
- ADD app/marketplace/(shop)/browse/evidence-preview/page.tsx: gated, authenticated and noindex route.
- ADD tests/marketplace-evidence-preview.test.ts: pure domain invariants.
- UPDATE app/marketplace/(shop)/browse/page.tsx: within gated shop, link to the prototype and remove an incorrect tablist role from ordinary navigation links.
- Do not link from the public explainer until feature and safety governance approve.

## Security and data boundaries

- All six listing records and seller labels are synthetic. Prices are illustrative only.
- No API, Stripe, invoice, product-order, web form, database, tracking or external seller request is invoked by the new preview.
- Local state only; page reload clears selections. Download is user-triggered and contains only synthetic selections.
- An item requiring specialist review cannot enter the local draft.
- Product evidence labels show "seller statement" or "unknown"; no fixture claims independent verification.
- Comparison never selects a "best" item, scores personal attributes, or uses paid placement.
- Restrict the page under the existing shop layout and /marketplace/browse path-gate; do not change the feature flag.
- A trusted production server still needs seller, ownership, stock, tax, price, recall, insurance, product classification, conflict-of-interest, and dispute controls.

## Critical separate backlog: untrusted Marketplace invoice pricing

The inspected components/marketplace/MarketplaceClient.tsx sends client-calculated unitAmountCents and line items to POST /api/billing/invoices. The inspected general invoice service calculates its draft from submitted items. This proposed UI does not call that flow. Before launching any transaction functionality, add a dedicated Marketplace server command accepting only listing/variant IDs and quantities, resolving canonical price/tax/safety/supplier details server-side, and requiring an authorised, versioned quote confirmation. Do not globally change the general billing invoice API without reconciling existing use cases.

## Participant and accessibility verification

- Keyboard navigation and meaningful focus for filters, comparison, expanders and local draft.
- Screen-reader labels and announcement when comparison or draft changes.
- 200–400% zoom/reflow without horizontal scrolling of primary content (the comparison table is intentionally locally scrollable).
- 44px-plus touch targets, reduced-motion compatibility, high contrast, no colour-only status.
- AAC/switch compatibility, interrupted-session recovery, Android TalkBack and iOS VoiceOver tests before any mobile adoption.
- Expert review of high-risk equipment and electrical/device claims, accessible complaints and human contact routes before any real supplier-facing service.

## Suggested verification (from repository root)

1. pnpm exec vitest run tests/marketplace-evidence-preview.test.ts
2. pnpm type-check
3. pnpm exec eslint components/marketplace/MarketplaceEvidencePreview.tsx app/marketplace/'(shop)'/browse/evidence-preview/page.tsx app/marketplace/'(shop)'/browse/page.tsx packages/marketplace-evidence/src/index.ts tests/marketplace-evidence-preview.test.ts
4. pnpm exec prettier --check components/marketplace/MarketplaceEvidencePreview.tsx app/marketplace/'(shop)'/browse/evidence-preview/page.tsx app/marketplace/'(shop)'/browse/page.tsx packages/marketplace-evidence/src/index.ts tests/marketplace-evidence-preview.test.ts
5. pnpm build and targeted Playwright a11y tests where infrastructure supports them.

Do not treat clean TypeScript syntax as proof of runtime accessibility or security. Record actual CI SHA and exact failure logs.

## External dependencies and release stop conditions

- PR #201: existing open draft Shopping pilot, potential future overlap in checkout domain; do not merge or enable.
- PR #621: open draft exact-logo design system, potential future styling reconciliation; avoid changing shared branding files.
- Other active security PRs must resolve independently; do not conceal expired dependency findings.
- Before production release: independent UX/accessibility, security, consumer-law, safety and billing/settlement review; verified inventory/merchant contracts; controlled synthetic deployment; human approval.

**Release decision:** design review only. Default-off; no deploy, no merge, no live purchases.
