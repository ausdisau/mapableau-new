# MapAble Marketplace — integrated one-cycle assurance implementation

**State:** Synthetic development prototype, awaiting review; not verified live commerce.
**Branch:** feat/marketplace-one-cycle-assurance-20261031
**Stacked on:** feat/marketplace-inclusive-commerce-v1-20261031 (draft PR #641)
**User outcome:** Participants, supporters, coordinators and staff can walk through a complete mock supplier-to-refund workflow without risking money or personal information.
**Release:** No production deployment, no Stripe actions, no merges, no feature activation.

## Decision and scope

Deliver all seven next milestones as a single bounded **testable assurance cycle**, while retaining strong distinctions between completed code and external human-operational readiness.

| Milestone | Implemented demonstration | NOT verified or operational |
| --- | --- | --- |
| Supplier onboarding | Fictional submission, six-category evidence checklist, reviewer decision, rejection | ABN, seller identity, real documents, contracts, registration |
| Product safety | Simulated ownership, condition, recalls, insurance checks, catalogue allowlist | Product inspections, clinical suitability, real recall feeds |
| Quotations | Trusted canonical sample prices, versioned quote, expiry, quantity, stock version | Tax advice, shipping contract, binding live quote, merchant terms |
| Supported decision-making | Participant-granted prepare-only 30-min scope, expiry, revocation and separate participant confirmation | Actual Core DelegationGrant integration, legal/decision-specific authority |
| Inventory and delivery | Mock stock reservation/release, dispatch, delay, receipt and cancellation | Physical fulfilment, inventory integration, couriers, service continuity |
| Returns and refunds | Participant return request, human return review, seller receipt, finance reversal | ACL decisions, refunds, insurance coverage or external settlement |
| Financial integrity | Two-entry fictional ledger and zero-cash balancing/reconciliation | Bank statements, Stripe Connect, PSP reconciliation, audited books |

## Architecture

Existing MapAble Core remains the system of record for identity, consent, audit, billing and permissions. No duplicate identity system was introduced. The actor picker here is a **simulation affordance only** and conveys no actual authorisation.

- \`packages/marketplace-inclusive/src/operations-cycle.ts\`: immutable deterministic state machine, explicit actor types and transitions, sample inventory/pricing, consent grant and audit event types.
- \`components/marketplace/MarketplaceOperationsLab.tsx\`: WCAG-oriented human-readable React action station with role selection, evidence review, quote, participant confirmation, delivery, returns, notional ledger and event history.
- \`app/marketplace/(shop)/browse/operations-lab/page.tsx\`: \`noindex\` view inheriting \`requireAuth\` and \`enforceYearOneModulePath\` from the existing shop layout. The flag \`MAPABLE_MARKETPLACE_ENABLED\` stays default OFF.
- \`tests/marketplace-operations-cycle.test.ts\` and \`tests/marketplace-operations-ui.test.tsx\`: trusted input, permissions, conditional workflow, cancellation, refund and accessibility-oriented controls.
- \`.github/workflows/marketplace-one-cycle-assurance.yml\`: isolated check plus normal repository Quality, CI, Security and Accessibility checks. A green scoped workflow is *not* release approval.

## State and permissions

Supplier may submit, dispatch, record delay and receive return. Reviewer may check sample evidence, approve/reject sample seller and approve return. Participant alone may issue/revoke preparation authority, confirm, cancel, acknowledge delivery and request return. Supporter/coordinator may prepare only while a valid participant-issued scope exists; role switching does not supply such permission. Finance may approve a notional refund and verify ledger balance.

Safeguards and error states: incomplete seller evidence, unsupported/unsafe item, invalid quantities, insufficient mock stock, out-of-date quote, expired/revoked grant, participant approval missing, attempt to dispatch before confirmation, return/refund outside the allowable state, corrupted ledger, backwards time. Fail-closed with accessible error feedback.

## Funding, consumer rights and privacy

The only sample prices are canonical PR #641 synthetic catalogue amounts. Shipping AUD 12 and GST AUD 0 are **fictional calculation assumptions**, not real rates or tax advice. The quote is **nonbinding**. The order is a browser-memory simulation. An entry called "refund" represents a notional reversal; NO real customer funds are received or returned. Reconciliation checks fake entries only; NO merchant, payment processor or bank statements are accessed.

No participant health, diagnostic, NDIS number, bank information, seller personal details or contact information is collected. No marketing lead is created. Training data and claims must always be labelled synthetic; no accreditation, TGA, NDIS funding or provider verification should be inferred.

## Operational dependencies (not delivered by this cycle)

Before actual supplier onboarding, quotes or payments:
- Use actual MapAble Core RBAC/ABAC, tenant and participant-delegation grants with purpose, consent receipt, expiry, revocation, audit and explicit confirmation.
- Obtain legal review of merchant-of-record, platform-service classification and in-scope NDIS platform registration, Australian Consumer Law and product warranties, TGA/recalls, GST, NDIS pricing and fundability.
- Build reviewable vendor file uploads, identity/ABN and independent compliance checks, qualifications and insurance (where relevant), renewal/expiry and appeals.
- Enforce stock/version concurrency and server-authoritative order prices with persistent event/audit records, tenant boundaries and idempotent commands.
- Integrate approved payments/settlement with real double-entry accounting, separate reconciliation statements, refunds/chargebacks, support and dispute case management.
- Supply human support and safeguarding processes, accessible complaints, recalls, insurance and return logistics.

## Accessibility acceptance plan

WCAG 2.2 AA is a target, not a certified status. Complete keyboard and focus testing for all 17+ transition steps; 200–400% reflow and text resize; screen readers on desktop/mobile; AAC/switch access; persistent explanations and text labels; predictable control order; low literacy; reduced motion; interruption and recovery. Require disabled participants, carers and coordinators to test quote confirmation and revocation paths before any real data/purchasing release. Visible roles in a demo must never be mistaken for real delegation.

## Validation

1. \`pnpm exec vitest run tests/marketplace-operations-cycle.test.ts tests/marketplace-operations-ui.test.tsx\`
2. \`pnpm type-check\`
3. \`pnpm exec eslint packages/marketplace-inclusive/src/operations-cycle.ts components/marketplace/MarketplaceOperationsLab.tsx "app/marketplace/(shop)/browse/operations-lab/page.tsx" tests/marketplace-operations-cycle.test.ts tests/marketplace-operations-ui.test.tsx --max-warnings 0\`
4. \`pnpm build\` and Playwright keyboard/a11y; verify exact head SHA and status.
5. Manually rehearse one full scenario from synthetic seller submission to human approval, participant consent, quote, confirmation, mocked stock/dispatch, dispute and refund reconciliation.

## Production controls and rollback

Keep \`MAPABLE_MARKETPLACE_ENABLED\` OFF. Remove the synthetic route and module with a feature revert if necessary; no migrations or data changes needed. No production activation or publishable supplier listings. Check PR #641 baseline and PR #640 for overlapping accessibility changes before any merge.

## Evidence and owners

Source of code evidence: current PR #641 at \`21df91b8a5784b0c9d682a1adb459dd075b91a8c\` and \`ausdisau/mapableau-new\`.
Owners to assign (not yet confirmed): technical owner for domain and tests; participant accessibility lead; platform security reviewer; consumer-law/NDIS counsel; operations/supplier assurance lead; finance/payments reviewer. No names, approval dates or external evidence are assumed.

**Release decision: NO-GO for production commerce.** Approval may be sought for additional synthetic, internal accessibility and operational tests after all relevant CI results are reviewed.
