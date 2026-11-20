# Employment & Rehabilitation Directories + MapAble One Native Operations

**Date:** 21 November 2026  
**Status:** review-only, stacked on MapAble Search draft PR #728; NOT deployed; flags default OFF; no new live bookings, workforce assignment, clinical treatment, payroll or NDIS claims.

## Decision and intended outcome

Build source-labelled Employment and Rehabilitation marketplace directories that connect to MapAble Search using one taxonomy. Reuse MapAble One as the shared native operational layer for workforce rosters, bookings, calendar, participant-controlled workflow, provider-owned billing and future Australian Disability Ltd accounting. Do not add a second identity, consent, booking, payment, client record or production search engine.

This PR provides a bounded, discover/compare/understand integration slice. It does not implement the full business operations described below.

## Evidence ledger

| Item | State | Direct source | Consequence |
| --- | --- | --- | --- |
| MapAble Search | In development | Draft #728: app/search/page.tsx, app/api/mapable-search/route.ts, lib/search/mapable-search-core.ts | Stack this PR on #728; no independent search gateway |
| Provider outlets | Implemented, not independently verified | NdisProvider model; lib/ingestion/ndis-providers-search.ts | Import is not regulatory registration, professional credential or availability proof |
| Jobs | Existing gated code | Job, JobApplication and employer publishing in lib/jobs/job-service.ts | Published status alone is insufficient for public release; require explicit approved employer IDs |
| Employment providers | Scaffold only | app/api/v1/employment-providers/route.ts | Do not present DES/IEA API as a verified live integration |
| Rehabilitation plans | Existing gated clinical workflows | lib/moves/plans-service.ts, app/clinician/moves/page.tsx | Do not expose private clinician data in public directory or org-wide provider dashboard |
| Provider operations | Existing code | app/provider/(console)/page.tsx, calendar, workers, capacity, bookings and billing routes | Reuse existing records, show only scoped aggregate Care metrics |
| MapAble One cross-service handoff | Proposed/partly built | lib/ecosystem/handoff-contract.ts, docs/ecosystem/service-handoff-contracts.md | No cross-domain mutations until scope, consent, audit and event ownership pass |
| Deputy comparator | Externally researched | https://www.deputy.com/au/features/scheduling-software | Pattern reference for shifts, leave, swaps and timesheet/payroll review, not an integration dependency |
| Splose comparator | Externally researched | https://splose.com/features/practice-management | Pattern reference for allied-health appointments, waitlists, clinical records and invoicing, not an integration dependency |

**Important:** Prior MapAble One and Australian Disability Ltd-owned AD One thinking envisaged a modular monolith/own native operations and ledger with replaceable statutory/payment adapters. This tranche neither creates a separate accounting platform nor proves one is live.

## Changed public surfaces

- **/search** and GET **/api/mapable-search**: type-validated new Rehabilitation vertical and employment/therapy category IDs. Existing Care, Transport and provider verticals are preserved.
- **/employment/directory**: public, keyboard-friendly search and filter page for explicitly approved published employer jobs and employment-support outlets (gated by independent sources).
- **/employment/directory/jobs/[jobId]**: source-labelled public role detail accessible only while the job is published and its employer is active and explicitly allowlisted; application action links to the separate authenticated workflow.
- **/moves/directory**: public, keyboard-friendly search and filters for imported therapy-support classifications.
- **/employment** and **/moves**: category cards linked to their directory; filters transfer to /search through a stable query contract.
- **/provider/one**: permissioned, **default-off**, read-only provider operations overview with existing Care aggregates and a native feature registry.
- Provider control panel: a MapAble One link appears only when the provider operations flag is enabled.

## Category taxonomy

| Area | Category IDs | Source interpretation |
| --- | --- | --- |
| Employment | all, job_vacancies, workplace_adjustments, employment_support | Job model with employer allowlist; imported employment classification |
| Rehabilitation | all, therapy, occupational_therapy, physiotherapy, speech_pathology, exercise_physiology, psychology | Provider imported registration groups/services; not clinician credentials |

**Category filter semantics:** source-provided text classifications are matched with parameterised PostgreSQL queries. A classification can be missing, outdated or ambiguous; it must not become professional registration or evidence of an open appointment. For sub-disciplines use exact service names from the source; do not broaden automatically to all Therapeutic Supports. Maps and driving distances should only be shown when source coordinates are grounded and specifically needed; list-first browsing works without a map.

## Default-off production gates

- MAPABLE_SEARCH_PROVIDER_INDEX_ENABLED=false: no live imported outlet queries unless explicitly enabled in approved preview after origin and data-quality review.
- MAPABLE_SEARCH_PUBLISHED_JOBS_ENABLED=false: no employer-published jobs in public search without approved release.
- MAPABLE_SEARCH_PUBLISHED_JOB_ORG_IDS= (empty): exact IDs of employer organisations with documented public publication approval. This list is *not* an access control mechanism for private applications; only approved published Job fields are selected.
- MAPABLE_ONE_OPERATIONS_HUB_ENABLED=false: no new provider operations route until role, workflow and accessibility checks pass.

Turning on a flag alone does not establish regulatory compliance, availability, active NDIS registration, clinical status or payroll readiness.

## MapAble One native operational vision

### From Deputy-style workforce scheduling

- Worker affiliation, service locations, availability patterns, leave, fatigue/breaks, role and credential evidence.
- Manual approval of roster proposals and changes; shift offer, acceptance and participant review retained as distinct events.
- Cross-provider conflicts and overlap checks require transactional, multi-instance reservations and a verified interval policy.
- Shift swapping cannot silently substitute a participant's chosen worker; preserve participant approval when care continuity changes.
- Attendance, timesheet amendments, manager review and payroll-ready export; no automatic SCHADS or other award interpretation without expert review.
- Optional roster templates, staff communications and notifications; avoid unnecessary GPS/time-clock surveillance.
- The existing care-shift system is a source of record; do not create a second shift table without an accepted migration and ownership plan.

### From Splose-style practice management

- Public service catalogue -> independently verified clinician/practice credentials -> appointment enquiry -> practitioner-controlled offer -> participant confirmation.
- Service-specific booking duration, appointment type (clinic/home/remote), buffers, recurrence, practitioner availability, room capacity, waitlist and accessible reminders.
- Separate clinically restricted caseload, versioned plan, progress note, attachments and telehealth; no public health data sync and no AI treatment authority.
- Group sessions, cancellation terms, no-show review, complaints and service recovery only after practice-specific rules.
- Approved attendance evidence -> provider-owned invoice draft -> participant review -> native ledger/reconciliation under separately reviewed accounting and payment rails.
- Existing Moves clinical plan writer remains the authority; no public directory inference of prescribed care.

### Employment and Rehabilitation as one journey

- Candidate searches jobs and employment support; any disability or adjustment disclosure is candidate-specific and revocable.
- Candidate approves interview and optional transport / Care assistance as separate actions; employer receives no hidden care or diagnosis data.
- Rehabilitation client independently selects a service and consents to clinical enquiry; practitioner verifies scope and makes an offer.
- Provider manages workforce capacity and service evidence in MapAble One; clinical notes are not visible to general workforce dispatch.
- Cross-domain plan/booking/cancellation handoffs are explicit intents; no silent rescheduling, duplicate charge, funding claim or participant-data copy.

## Contracts for future transactional implementation (NOT built here)

- **ProviderServiceOffering**: providerOrganisationId, serviceCategoryId, publicDescription, serviceLocation, offeredAppointmentModes, priceDisclosure, bookingState, source/evidence, authorityToPublish, archivedAt.
- **AppointmentIntent**: participantId (private), organisationId, serviceId, proposedWindow, purpose, consentScope, expiresAt, actorId, version, state=draft|requested|offered|accepted|declined|cancelled.
- **PractitionerAvailability**: clinicianId, organisationId, timezone, calendarSlot, capabilityScope, verifiedUntil, availabilityVersion. Do not derive from opening hours.
- **WorkforceReservation**: workerProfileId, scheduleInterval, bookingId, workerConsent, participantApproval, credentialSnapshotRef, exclusion constraints. Must reject overlap atomically.
- **ServiceEvidence**: activity/visit, actualStart/end, reviewStatus, versioned evidence and audit references. Do not equate a scheduled event to a delivered service.
- **InvoiceDraft**: provider-owned service records, itemised prices, adjustments, participant approval and dispute state, followed by double-entry ledger only when controls pass.

All future writes must use existing authenticated MapAble Core permissions and transactional outbox patterns; do not add a parallel customer/patient identity store or integrate a proprietary vendor as a mandatory production database.

## API/search controls

- GET /api/mapable-search?vertical=jobs|rehabilitation&category=...&q=...&state=NSW&postcode=2000.
- Read-only Zod validation with typed category-to-vertical compatibility checks.
- No public applicant records, resumes, adjustment requests, clinical notes, health data, screening identifiers, or appointment attendance.
- Rate limiting from PR #728 is process-local. **Distributed edge rate limits are still required before scaled public access.**
- Search provenance, source updated date, missing availability and uncertain status must remain explicit.
- No external Exa, Parallel, job scraping, Google scraper, crawlers or generative AI service is activated.
- Do not promote search rank through fees or use advertising to override mandatory access-fit or person-chosen preferences.

## Accessibility and operational safeguards

Target WCAG 2.2 AA with accessible non-map lists, labelled search controls, true status text, 44px targets where practical, 200/400% zoom and reflow, NVDA/VoiceOver, switch and AAC tests, and disability-led usability validation. Ensure consistent keyboard focus, filters, no-match notices and no forced medical disclosure. Human contact and corrections remain accessible when data is empty or wrong.

Before any real clinical/rehab booking: verify professional registration (where applicable, including AHPRA), scope and supervision, clinical governance, consent, privacy, appointment availability, cancellation and safeguarding. Before monetised NDIS coordination or matching: obtain current regulatory review of platform obligations and NDIS practice standards. Current job publication/adjustment workflows also require employer record verification and anti-discrimination review.

## Testing and release plan

**Automated unit tests added** in tests/search/employment-rehabilitation-directories.test.ts cover domain separation, source-labelled status, taxonomy filters, MapAble One register statuses and unknown availability.

Run in authorised checkout:

~~~bash
pnpm exec vitest run tests/mapable-search-discovery.test.ts tests/search/employment-rehabilitation-directories.test.ts
pnpm exec tsc --noEmit
pnpm lint
pnpm build
pnpm ci:production-claims
pnpm ci:feature-dependencies
pnpm test:a11y
~~~

Also add E2E:
1. /search?vertical=rehabilitation&category=speech_pathology only returns tagged source outlets and never invalid foreign categories.
2. No imported index flag -> no false providers or appointments; no approved-job flags -> no published jobs.
3. Source down -> public directory clearly reports incomplete/no-match, not invented fallback.
4. One provider tenant cannot read another tenant's operations.
5. Worker screening / practice registration always unknown unless independently verified.
6. Applicant/rehab/private records absent from public props, HTML, JSON, analytics, logs, suggestions and crawler output.
7. Roles can use filters with keyboard-only, screen reader, zoom and AAC.
8. No restricted clinical route bypass by using MapAble One links.
9. Rate limits, anti-automation and unsupported-data payload tests before public pilot.
10. Public job detail returns not-found for draft, closed, unapproved or inactive employer records and never fetches application/adjustment data.

## Dependency and merge sequence

1. Review and test MapAble Search draft **#728** and its baseline first.
2. Review this stacked directory + MapAble One PR against the #728 head; rebase after #728 is merged.
3. Reconcile Care Scheduler draft #733 and the previous MapAble One ecosystem handoff; do not duplicate its canonical calendar, authentication or billing.
4. Make source-of-record/provenance and employment opt-in decisions before public flag enablement.
5. Separate later transactional PRs for native appointment and workforce booking, consent/audit, clinic waitlist, billing, payroll and native ledger.

**Current decision:** GO for draft review and isolated preview tests only. NO-GO for public production release, real bookings, healthcare instructions, job auto-application, worker assignment, invoices, payroll, NDIS claims or external partner connection.

**Verification limitation:** this task used live GitHub connector evidence but could not complete a repository checkout or run full Next.js CI in the current environment; production and tests are not assumed green.
