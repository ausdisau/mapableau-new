# MapAble Day — competitor-informed design patterns and legacy integration

**Date:** 9 November 2026 (Australia/Sydney)  
**Status:** In development; default-disabled, read-only UX increment. Not a production release.  
**Repositories:** [canonical Day engine PR #32](https://github.com/ausdisau/MapAble/pull/32) and [legacy production-linked mapableau-new](https://github.com/ausdisau/mapableau-new).  
**Research:** Competitor evaluation completed 9 November 2026. Public help workflows and vendor descriptions were inspected; authenticated commercial vendor workspaces were not independently operated.

## Decision

Use **participant-owned, evidence-aware day coordination** as the differentiator. Do not build a second roster, payment service, identity system or consent engine. MapAble Day must help answer: "Can my day still work, what remains uncertain, and what can I choose to do next?" without using a booking status to assert worker competency, AAC acknowledgement, accessible vehicle compatibility or service completion.

## Evidence ledger

| Observation | Evidence grade | Direct source | Implication |
| --- | --- | --- | --- |
| MapAble's canonical Day prototype has five synthetic scenarios, deterministic dependency checks, participant-directed non-executing recovery, separately gated self-calendar read and DayEval. | Inspected code / draft PR, **not live** | [MapAble PR #32](https://github.com/ausdisau/MapAble/pull/32) | Reuse its engine as the future canonical Day authority; avoid duplicating it in the legacy repo. |
| The current legacy dashboard uses authenticated participant-scoped care bookings and transport trips, with an optional AI panel. | Inspected legacy code, production operation not independently validated | lib/dashboard/load-my-day.ts; app/dashboard/page.tsx | Build a safe presentation increment from these existing records. |
| Mable's client app describes cancel, reschedule and replacement quick actions. | Official step-by-step product help | [Mable client app](https://mable.com.au/help_centre/mable-client-app/) | Put clear recovery actions near disruptions rather than under administration menus. |
| Hireup allows participant-side booking requests to several workers; its support-plan reading gate is documented. | Official help workflow | [Hireup booking](https://help.hireup.com.au/hc/en-us/articles/13502083241103-Booking-Requests-For-Clients); [support plan](https://help.hireup.com.au/hc/en-us/articles/38977143153433-How-to-view-and-edit-your-support-plan) | In a future authorised workflow, separate requesting, candidate evidence, participant selection and confirmed acceptance. Receipt of instructions must not be presented as proven understanding. |
| ShiftCare and AlayaCare document AI-supported vacancy recovery and integration capability. | Official vendor documentation, some claims not independently executed | [ShiftCare replacement](https://help.shiftcare.com/en/articles/17673098-finding-replacement-staff-members-with-ai); [AlayaCare agent](https://alayacare.com/en-au/scheduling-agent/) | Permit AI explanations or draft options only; execute changes through deterministic, scoped human-authorised services. |
| CareMaster TRIPS documents vehicle configuration, runs and dispatch. | Official help workflow | [CareMaster TRIPS guides](https://support.caremaster.com.au/guide/articles) | Use feature-level vehicle and participant fit evidence, not a generic accessibility badge or "driver assigned". |
| Tiimo and Structured demonstrate readable daily timelines, low cognitive load and device accessibility features. | Official product/help evidence; not a WCAG audit | [Tiimo](https://www.tiimoapp.com/product/visual-planning); [Structured accessibility](https://help.structured.app/en/articles/4725634) | Progressive disclosure, usable timelines, clear headings, screen-reader/voice/switch testing and flexible presentation. |
| LifeVal benchmarks personalised, agentic tasks against reproducible state and a rubric, not persuasive narration. | Research paper, **not** NDIS/clinical validation | [LifeVal arXiv:2611.06687](https://arxiv.org/abs/2611.06687) | DayEval must grade observable state diffs, zero-tolerance violations and participant decisions. |

**Evidence warning:** A public workflow or vendor claim is not independent proof of security, accessibility conformance, worker clearance or a specific API entitlement. Unverified capabilities remain unverified.

## Implemented in this legacy-repository PR

This increment builds a **display-only continuity review** for existing participant-scoped records, under the new default-false environment flag \`MAPABLE_DAY_CONTINUITY_REVIEW_ENABLED\`. It:
1. surfaces cancelled and unknown care/transport items even when an aggregate summary remains "confirmed" because another record is accepted;
2. shows pending items with plain-language source status and direct links to the existing detail pages;
3. explicitly marks worker suitability, vehicle fit, AAC acknowledgement and cross-service dependencies **not assessed**;
4. offers participant-directed navigation to Care, Transport, accessibility preferences, Consent and Help & Safety;
5. never changes bookings, sends messages, invokes AI, shares records, auto-assigns workers/vehicles or claims readiness;
6. uses the existing \`requireAuth\`/server-scoped My Day loader and existing dashboard. No API, schema, database, session or role changes.

This is **not** the canonical LifeVal dependency engine. Keep full case orchestration and future DayEval in [MapAble PR #32](https://github.com/ausdisau/MapAble/pull/32), and converge on a single shared, versioned contract only after an explicit architecture decision and compatibility tests.

### UX design-system patterns for the next increment

| Pattern | Interaction contract | Safety / accessibility guard |
| --- | --- | --- |
| **Today at a glance** | Current goal and day timeline, next action above deep administrative tools. | Text/list alternative, readable at 400% zoom, no colour-only states. |
| **Evidence-labelled state** | Distinguish recorded, requested, accepted, worker-eligible, AAC-reviewed, transport-fit, participant-approved and completed. | Show exact source, time, validity and scope; never upgrade unknown evidence from a calendar event. |
| **Disruption card** | Describe what changed and which downstream appointments may be affected. | Do not infer cancellation propagation without an evidenced dependency. |
| **Recovery options** | Review existing booking, request a suitable replacement, ask for assistance, reschedule only after choice. | Preview consequences, costs, disclosure and human owner; no silent substitution. |
| **Communication passport handshake** | Worker acknowledges receipt/review of specific participant-authored guidance. | Receipt is not proof of comprehension; preserve participant's AAC mode and response time. |
| **Transport fit checklist** | Wheelchair/transfer preferences, lift/ramp, securement, space, pickup/return support and evidence provenance. | Booking confirmation is separate from suitability; never assume a vehicle is accessible to all. |
| **Delegated authority receipt** | Who may see/request/approve what, why, until when, with immediate revocation. | Reuse MapAble Core scopes and audit, no implicit guardian/family authority. |
| **AI as explanation, not authority** | Observe → explain → propose → participant chooses → preview → scoped execution → verify receipt. | Default non-AI path and zero autonomous changes before separate sign-off. |

## Gap states and participant journey

Use these distinct concepts: **recorded status** (what a system says), **evidence status** (what was checked and when), **participant decision** (what the person wants), and **execution receipt** (what actually happened). Only the canonical deterministic engine may calculate cross-domain feasibility once integration contracts are validated. Until then, the legacy dashboard displays \`not_assessed\` for whole-day readiness.

Example: one shift was accepted and another cancelled. An aggregate summary might say "confirmed", but the new continuity view must surface the cancellation separately. A replacement worker with no evidence is a **candidate**, not "verified"; a vehicle with an assigned driver is **not** proven compatible; a sent AAC document is **not** proof of acknowledgement or understanding.

## DayEval test roadmap (proposed; not all implemented)

| Case | Expected observable result |
| --- | --- |
| 01 Baseline | Correct recorded status; no invented readiness or action. |
| 02 Mixed accepted/cancelled | Cancellation visibly surfaced despite a confirmed aggregate. |
| 03 No suitable worker | Unknown credential evidence stays blocked; human fallback. |
| 04 Wheelchair transport mismatch | Booking/vehicle assignment cannot imply accessibility fit. |
| 05 AAC not acknowledged | Communication readiness remains separately unverified. |
| 06 Return journey lost | Outbound "ready" never masks return-trip dependency. |
| 07 Consent withdrawn | No future access or disclosure under revoked grant. |
| 08 Delegate scope exceeded | Deny and audit out-of-scope reads/writes. |
| 09 Duplicate change request | Same idempotency key cannot create repeat bookings. |
| 10 Sydney DST transition | No incorrect local-day or appointment boundary. |
| 11 AI/network unavailable | Non-AI human-assisted recovery available. |
| 12 Conflicting or stale evidence | Mark conflicted/stale, no confident confirmation. |

**Grading rule:** executable actions must be evaluated against independently observed, authorised state changes. A pleasant explanation cannot compensate for a fabricated confirmation, privacy leak, consent violation, unapproved substitution or ignored communication requirement. Use synthetic data and external safety review before moving any scenario into live workflows.

## Accessibility and release criteria

Target **WCAG 2.2 AA**, not an unsupported conformance claim. Test with keyboard-only, screen reader, switch, voice/speech input, AAC-compatible text entry, 200–400% zoom/reflow, forced-colours/high contrast and reduced motion. Confirm visible/non-obscured focus, 44px preferred interactive targets, clear headings/reading order, non-colour state labels, reachable help paths and understandable errors. Automated axe/Playwright tests supplement, not replace, disability-led manual acceptance.

Privacy: do not export personal care/health/location records to analytics or AI for this preview. It derives from the existing authenticated snapshot; no new collection, audit-store, delegated privilege or sharing. Reuse MapAble Core consent and authority in future increments.

## Delivery and release gates

- **Now (this PR):** unit-test status derivation including mixed accepted/cancelled, pending, unknown, no-record and no-fabrication. Preview flag defaults off. Perform focused lint/typecheck/a11y review; preserve the current production alias.
- **Next 90 days:** reconcile with canonical PR #32 and CareOS, define provenance-typed evidence adapters, validate scope/revocation, add participant-approved recovery proposals, AAC handshake and transport compatibility models. Pilot read-only source integrations before any writes.
- **Later:** one scoped, non-production write sandbox with authorisation, preview, idempotency, post-write state reconciliation, appeal/recovery and an accountable human owner. Seek separate production and clinical/privacy release approval.
- **Stop conditions:** automated worker/vehicle replacement, inferred credentials, unapproved data disclosure, accessible-transport claims without fit evidence, identity/consent reimplementation, hidden uncertainty, or missing communication access.

### Vercel deployment baseline (observed 9 November 2026)

The domain \`mapable.com.au\` resolves via Vercel project \`mapableau\` (project \`prj_iAhQk0b6IhigXw58PFiYfiHSATmW\`) linked to \`ausdisau/mapableau-new\`; it was assigned to an earlier READY production deployment. The latest \`main\` production build (commit \`58fffa6\`) failed type checking at \`components/brand/MapAbleBrandLockup.tsx:95\`: lowercase JSX \`fetchpriority\` must be camel-case \`fetchPriority\`. That failure **pre-exists this Day increment**. An earlier successful deployment from \`cursor/marketing-logo-redesign-acbe\` includes a related fix. Vercel's project metadata labels \`mapableau\` as Create React App while its build log detects Next.js 15; verify settings in a separate deployment review and do not assume this metadata caused the type error. The runtime region was recorded as \`iad1\`, requiring an Australian data-residency review before introducing sensitive new server-side processing.

No Vercel settings, DNS, production alias, environment variables, database, merger or release are changed by this PR. Any automatic Git-linked preview must be treated as non-production test evidence, not a public launch.

**Owners and sign-off:** MapAble product/care lead for participant journeys; frontend/accessibility lead for AT acceptance; Core security/privacy owner for permissions/data; clinical/NDIS subject-matter reviewer for high-risk assumptions; Vercel/release owner for deployment validation. Sign-off is outstanding.
