# Coming Soon Journey Previews - Review and Release Gates

Date: 21 November 2026. Status: review-only implementation, not a production release.

## Problem and scope

Eight public programme pages display planned capabilities without showing what users would actually do, what safety checks must pass, or what happens when services fail. This change adds expandable, static, accessible journey descriptions to the shared public page component. No API, database, payments, booking, worker assignment, feature flag or authentication state is changed.

## Evidence

- Public programme pages: `app/care/page.tsx`, `app/employment/page.tsx`, `app/foods/page.tsx`, `app/moves/page.tsx`, `app/kids/page.tsx`, `app/marketplace/(public)/page.tsx`, `app/(marketing)/peer/page.tsx`, `app/(marketing)/telehealth/page.tsx`.
- Existing components: `components/marketing/PublicModulePage.tsx`; existing transport maturity matrix `lib/transport/feature-status.ts`.
- Pending overlapping work: PR #39, #84, #92, #695, #703, #711, #712, #715, #728.
- Vercel observation: `mapable.com.au` attached to project `mapableau`; later main production deployments failed. No claim that this branch is in production.

## Feature preview implementation

`lib/marketing/coming-soon-journeys.ts` defines eight programme-specific static user journeys with an outcome, steps, release gate and accessible failure recovery. `components/marketing/PlannedJourneyPreview.tsx` renders these using an ordinary semantic section and native `details/summary` without JavaScript state or a transaction control. The existing public page accepts an optional `roadmapModule` prop; this is additive and does not alter existing `availableNow` and `comingSoon` lists.

## Module rollout priorities

| Priority | Programme | First safe vertical slice | Human release gate |
| --- | --- | --- | --- |
| P0 | Care | Consent-reviewed support enquiry, source-labelled provider response, withdrawal and human assistance | Provider identity, worker eligibility separation, participant permissions and recovery |
| P1 | Employment | Skills-first discovery and controlled adjustment request | Employer review, separate sensitive data scopes and anti-discrimination testing |
| P1 | Transport | Verified access-fit review and trip evidence | Driver/vehicle eligibility, privacy, cancellation and dispatch operations |
| P1 | Access | Provenance, venue corrections and photo evidence | Moderation, redaction, uncertainty and source freshness |
| P2 | Moves | Therapy discovery and appointment enquiry | Professional verification and clinical privacy |
| P2 | Telehealth | Accessible appointment readiness and waiting room | Practitioner verification, scoped tokens, human fallback |
| P2 | Marketplace | Risk-labelled catalogue and transparent fees | Vendor verification, recalls, consumer dispute and controlled sandbox payments |
| P3 | Foods | Meal/grocery discovery with segregated prices | Food safety, allergy governance and fulfilment |
| P3 | Kids | Family discovery without a stored child profile | Child safeguarding, authority and child participation |
| P3 | Peer | Read-only moderated stories | Trained moderators, reporting and non-retaliatory appeals |

## Acceptance criteria and test plan

1. All eight programme pages render the read-only preview and keep the existing honest availability copy.
2. Each preview has an outcome, at least three steps, a named release gate and failure recovery.
3. Screen readers announce the section heading and the native expandable summary; keyboard activation and visible focus work. Verify 200% zoom, switch control and WCAG 2.2 AA, then perform disability-led usability testing.
4. No misleading claims of current NDIS funding, worker screening, live appointment availability, prescription, booking or payment capabilities. Current NDIS rules must be verified via official authorities before any future transaction release.
5. No introduced database migration, API writer, live flags or external integration.
6. Run `pnpm exec vitest run tests/coming-soon-journeys.test.ts`, `pnpm type-check`, `pnpm lint`, `pnpm build`, `pnpm ci:production-claims`, `pnpm ci:feature-dependencies`, `pnpm test:a11y` on a real repo checkout. CI and deployment verification have not been performed by this PR author.

## Stop conditions

No merge or production deployment until the base pipeline is healthy and reviewers establish the production deployment SHA, overlap with existing work, accessibility testing and copy accuracy. Live enrolment, bookings, payments, AI-driven assignment and NDIS claiming remain out of scope. A user must always be able to find an accessible human contact route before a regulated pilot launches.
