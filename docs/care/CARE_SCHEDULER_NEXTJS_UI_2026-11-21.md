# MapAble Care & Support Scheduler: Next.js / TSX UI

**Date:** 21 November 2026. **Status:** Draft branch, read-only, not production-ready.

## Mission

Deliver a participant-led weekly care schedule and provider roster using the current MapAble Next.js 15 App Router, React, TypeScript and Prisma architecture. Adapt the OpenManikin builder's typed, modular, accessibility-first approach without introducing Vue, Vite or Tauri. The system must remain independent of real payments, worker assignment, autonomous rostering and clinical decisions.

## Repository evidence and assumptions

- Source: ausdisau/mapableau-new, main SHA a8b7bfbb850563673a3622a49d73341c3c37d0fb at inspection.
- Existing CareShift, CareRequest, CareBooking and CareRosterAssignment data, shift offers, worker eligibility, recurring schedules and role-scoped auth are already in the codebase.
- Existing provider roster is a list; this change adds a weekly matrix with accessible list alternative.
- Recurring schedules are gated off by default and have unresolved Sydney local-time/UTC materialisation risks.
- The participant-first offer sequence in current code differs from the worker-first/final-participant-confirmation concept.
- Worker assignment needs concurrency-safe reservations; this UI deliberately does not attempt assignment.
- Transport coordination remains independently authorised and is never modified here.
- PR #22 has a disclosed historical secret-compromise warning; PR #95 includes optional conditional auto-assign and must not be merged without rights review; PR #103 concerns affiliations; PR #715 is advisory synthetic cartography.

## Scope and deliverables

| Surface | Route | Data scope |
| --- | --- | --- |
| Participant week | /care/scheduler | Only participant's own CareShift rows |
| Provider matrix | /provider/care/scheduler | Only shifts and workers for a verified organisation membership |
| Worker week | /worker/schedule | Only shifts for the authenticated user's active worker profiles |

- components/care/scheduler/CareSchedulerBoard.tsx: responsive weekly calendar, worker matrix, status filters, accessible list and links to existing operations.
- lib/care/scheduler/ui-model.ts: date-only maths, Australia/Sydney presentation, status descriptions and typed contracts.
- lib/care/scheduler/load-week.ts: server-only Prisma selectors, capped at 201 rows and 200 displayed. Sensitive notes, diagnoses and home addresses are excluded from client props.
- lib/config/care-scheduler.ts: MAPABLE_CARE_SCHEDULER_UI_ENABLED defaults to false.
- Existing participant/provider/worker pages show links only when the flag is enabled.
- tests/care/care-scheduler-ui.test.ts: week boundaries, DST display, attention labels and date input validation.

## Participant journey

1. A signed-in participant opens the weekly Care schedule.
2. They review shift dates, status and known worker assignments with text status labels.
3. They navigate weeks, filter records, and optionally choose the list rather than a calendar grid.
4. They open the existing shift details for service review, approval, dispute or assistance.
5. A change in Care does not silently mutate a linked Transport trip.

## Provider and worker journeys

- A provider admin selects an organisation from their existing authenticated membership; unauthorised organisation IDs fail closed.
- The provider sees a worker-by-day schedule matrix and an unallocated-shift row.
- The provider opens existing Care booking/shift pages to act; the new matrix has no assignment writer or drag-and-drop controls.
- A worker sees shifts only on their linked active worker profiles; offer acceptance stays in the existing worker Today page.

## Permissions and privacy

The app authenticates through existing MapAble guards. Queries filter by participantId, server-validated organisationId, or workerProfileIds resolved from the signed-in user. There is no client-selected tenant authority or socket join. Dates are stored as UTC instants but rendered in Australia/Sydney. This does not repair the independent recurrence materialiser. Names and service labels are shown only where relevant to the role. No patient diagnosis, screening ID, full address or precise location is serialised.

A scheduled record must not be described as proof of worker acceptance or participant consent. Client-side status labels are informational, never authority.

## Accessibility acceptance

Target WCAG 2.2 AA with keyboard, screen-reader, switch and AAC testing by people with disability; do not equate automation with conformance. The board has semantic headings, visible text statuses, button pressed states, scoped table headers and captions, clear focus indicators, 44px-high primary controls, and a complete list view. Verify 200% and 400% zoom, long names, overnight shifts, empty states, reduced motion and narrow screens. The provider matrix scrolls within its container without making the page horizontally overflow.

## Release gates and prohibited actions

1. Verify row-level permissions and cross-tenant negative tests.
2. Confirm all date/time and DST display examples, including Sydney timezone transitions.
3. Test no worker double-booking and no inappropriate role access in the separately scoped writer services before enabling any scheduling mutations.
4. Obtain current NDIS screening, competence, confidentiality, continuity and incident-control review for the real operating model.
5. Reconcile participant/worker acceptance state order, recurrence conversion and calendar event idempotency in separate PRs.
6. Confirm CI builds and targeted accessibility tests, manual co-design evaluation and rollback path.
7. Keep live payments, NDIA submissions, autonomous assignment, location tracking and production feature flags disabled.

## How to run the review slice

For an explicitly authorised local or preview environment, set:

~~~env
MAPABLE_CARE_SCHEDULER_UI_ENABLED=true
~~~

Then inspect package.json and use:

~~~bash
pnpm exec vitest run tests/care/care-scheduler-ui.test.ts
pnpm type-check
pnpm lint
pnpm build
pnpm ci:production-claims
pnpm ci:feature-dependencies
pnpm test:a11y
~~~

The draft author did not run a full local Next.js build because GitHub connector access did not provide an installable checkout in this environment. Review GitHub CI/preview checks for actual verification; do not infer readiness from code presence.

## Next implementation increment

Design and test atomic worker reservations, verified worker availability/affiliations, rights-based approvals, timezone-correct recurring Care and separately consented Transport coordination. Only after these gates pass, consider server-authorised read-only Socket.IO notifications with durable event IDs and reconnect resync.

**Release decision:** GO for draft review and isolated read-only preview; NO-GO for live care assignment, automated rostering, real billing, NDIS claims or production release.
