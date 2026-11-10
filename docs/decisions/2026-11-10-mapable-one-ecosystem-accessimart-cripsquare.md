# MapAble One: AccessiMart × CripSquare × Challenges × Day — controlled integration

Date: 10 November 2026  
Repository: `ausdisau/mapableau-new`  
Status: **draft, read-only discovery only; not deployed or independently accessibility-tested**

## Decision

Introduce a public `/ecosystem` service hub as the smallest safe vertical slice. Reuse existing public routes for MapAble Challenges (community), Access, Care, Transport, Employment, Marketplace and Provider Finder. Represent MapAble Day and CripSquare federation as **planned**, not as active links.

**No-go** for commerce, automated bookings, worker assignment, live account federation, private community data transfers or production rollout.

## Source evidence

- Legacy `app/community/page.tsx`: default browser-local fictional Signal workspace; real community records are a separately flagged authenticated mode.
- Legacy `app/marketplace/(public)/page.tsx`: explicitly says checkout not a current production claim.
- Existing `/care`, `/transport`, `/employment`, `/provider-finder` public information routes.
- Canonical `ausdisau/MapAble` PR #32: Day feature-gated draft with synthetic scenarios and a separately gated self-calendar read. Do not copy into legacy without conflict and privacy assessment.
- Canonical PR #10: synthetic Marketplace closed alpha. Do not merge with this implementation or activate transaction flags.
- Canonical PR #35: Access & Inclusion/Mapping Days survey integration remains a draft.
- `ausdisau/CripSquare`: independent community application and data model; existing `apps/places` prototype is not a live federation.
- User-supplied `AccessiMart.zip` inspected for product schema, supplier schema, API types and seed categories. It contains supplier seed records set to `verificationStatus: "verified"` without matching independent verification; the `artifacts/api-server/src/routes/admin.ts` routes contain no authentication guard in the inspected handlers and can return orders/quotes with contact information. The original data and backend must not be mounted into a live MapAble service.

## Files and contract boundaries

- `app/ecosystem/page.tsx`: accessible public journey/navigation page, not an orchestration engine.
- `lib/ecosystem/service-directory.ts`: typed cross-service directory with evidence and planned status.
- `lib/ecosystem/handoff-contract.ts`: non-executing cross-service draft schema; no network or database writes.
- `lib/marketplace/accessimart-review-adapter.ts`: review-only, whitelisted metadata; no supplier IDs, prices, personal data, orders, checkout or claims of verification.
- `app/marketplace/(public)/page.tsx`: non-transactional link to service hub.
- `tests/ecosystem/*`: source and authority separation checks.

## Journey design

| Participant goal | Discovery path | Rights safeguard |
| --- | --- | --- |
| Participate in community | Challenges -> Access -> Transport/Care -> planned Day/CripSquare | No implicit location sharing or publication |
| Get to work | Employment -> Access/Transport -> Care -> planned Day | Job seeker controls disability disclosure |
| Find equipment | Marketplace -> Provider Finder -> planned CripSquare -> NDIS support guidance | No funding or product safety assurance inferred |
| Organise my day | Provider Finder -> Care -> planned Day -> Transport | No unverified worker clearance, no silent bookings |

All participant-specific state remains in its source module. Future actions require authenticated session authority, scoped permissions, explicit participant confirmation, revocation semantics, auditable changes, service ownership, manual recovery and a safe no-AI path.

## Regulatory and privacy requirements

- Check current NDIS Act and NDIS Commission registration rules for platforms before worker or support booking; human legal/compliance approval.
- Provider registration, individual screening status, qualification and fit are separate. Do not call NWSD without authorised access. Never publish a single 'safe worker' badge.
- Follow Australian Consumer Law, ACCC product safety, TGA/ARTG requirements where applicable, privacy notices and data residency review before live listings or purchasing.
- The NDIS supports list is not an individual funding approval. Keep source claims and current rules separate.
- No health, disability plan, contact, exact location, community membership, private message or identity linkage across services without specific authority.
- Include complaints, appeal, withdrawal, moderation and safeguarding escalation for any later participant-facing pilot.

## Accessibility acceptance gate

Target WCAG 2.2 AA. Complete manual keyboard, NVDA/VoiceOver/TalkBack, switch/AAC input, 200–400% zoom/reflow, touch target, screen-reader status, focus retention, plain-language and interrupted-journey tests. Conduct disability-led usability review; automated passing tests do not establish conformance.

## Test and release plan

1. Verify exact branch HEAD, dependencies, source routes and overlapping PRs.
2. Run `pnpm exec vitest run tests/ecosystem`, `pnpm type-check`, targeted ESLint and formatting.
3. Classify failures as introduced or pre-existing. Collect test output and link exact workflow SHA.
4. Check no data is copied to a different tenant, no unreviewed product/seller status becomes 'verified', and default flags remain off.
5. Run accessibility QA and security/privacy review.
6. Produce a protected, synthetic-only preview **only after** review and separate approval; do not alter existing Vercel production projects.

## Remaining work and blockers

- Actual MapAble Day port from PR #32 is **not done**; source is a separate draft.
- CripSquare federation, consented private messaging, moderation integration and trust evidence registry are **not done**.
- AccessiMart genuine catalogue ingestion, vendor onboarding, verification, product-safety workflow, payment settlement, invoice disputes and consumer guarantees are **not done**.
- Live Marketplace, cross-service bookings and participant-data handoffs remain **NO-GO**.
- Unit tests were added but have **not been executed locally** in this workflow; use GitHub CI and/or Cursor terminal.
- No production deployment or live business metrics have been verified.

Human approval is required for the next release stage.
