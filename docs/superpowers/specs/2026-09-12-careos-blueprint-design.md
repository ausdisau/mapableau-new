# CareOS Blueprint — Consolidated Design

**Status:** Proposed architecture; approved through the design dialogue and consolidated here for repository review. This document does not itself change production behaviour, registration status, legal authority, payment authority, NDIS entitlement logic, or public capability claims.

**Date:** 2026-09-12

**Repository baseline inspected:** `main` at `3810fe810301ba73f855cd8ba4cfc2adf23eb9d3`

**Parent constitutional design:** `feature/full-life-os-constitution:docs/superpowers/specs/2026-09-10-full-life-os-constitutional-design.md`

## Decision

Consolidate MapAble's existing participant-facing modules into **CareOS**, a participant-controlled Full Life Orchestrator inside the broader MapAble Full Life OS.

CareOS becomes the single participant-facing operating environment for coordinating goals, missions, accessibility, support, mobility, work, home, discovery, money, communication, evidence, recovery, and human support. Existing specialised domains remain bounded, authoritative engines behind CareOS rather than being flattened into a single monolith.

The architectural doctrine is:

> **One life. One operating environment. Many bounded capabilities.**

> **The participant navigates their life; CareOS navigates the systems.**

> **Models propose. Rights constrain. Authority permits. People decide. Deterministic systems act. Evidence records what happened.**

> **When something fails, CareOS repairs the path before questioning the person's destination.**

## Current state

CareOS is not greenfield. Current `main` contains a canonical mission service at `lib/careos/canonical-mission-service.ts`, a canonical mission migration at `prisma/migrations/20260714170000_canonical_careos_mission/migration.sql`, substantial domain implementations under Care, Transport, Jobs, Marketplace, AbilityPay, Access, Home & Living and Support Coordination, and existing participant-facing module routes.

The repository also contains architectural debt that must be converged before broad feature expansion. Current analysis identifies multiple mission/intelligence persistence paths, conflicting or stale programme documentation, fragmented evidence semantics, incomplete event-relay maturity, and participant-facing navigation that still mirrors module boundaries. Current code and migrations outrank stale planning documents when they conflict.

This blueprint therefore defines **convergence of existing implementation**, not a replacement platform.

NDIS and other regulatory requirements are time-sensitive. Any implementation or release claim involving current NDIS rules, registration, safeguarding, funding or claiming must be verified against current official sources at execution and release time; this design is not a guarantee of legal or regulatory compliance.

---

# 1. Scope, purpose, and architectural position

## 1.1 CareOS is the Full Life mission fabric

CareOS is the participant-controlled orchestration layer under the Full Life Constitution and Constitutional Rights Kernel.

Its central responsibility is:

> **Turn a participant-defined life objective into a safe, rights-compatible, understandable, and recoverable sequence of coordinated actions across systems.**

CareOS is not primarily a provider-management platform, case-management platform, roster system, transport-dispatch system, ATS, plan-management ledger, clinical record, or NDIS entitlement engine.

CareOS is the **executive-function layer**, not executive authority. It carries computational coordination burden—remembering, checking, connecting, anticipating, comparing, explaining and recovering—while leaving choosing, consenting, refusing, changing one's mind and defining what matters with the person.

## 1.2 Parent architecture

```text
MAPABLE FULL LIFE OS
│
├── Full Life Constitution
│
├── Constitutional Rights Kernel
│   └── capability layer over existing RightsOS authority
│
└── CAREOS
    ├── Life Plane
    ├── Mission Fabric
    ├── Intelligence Plane
    ├── Control Plane
    ├── Evidence + Recovery Plane
    └── Capability Plane
        ├── Access
        ├── Care
        ├── Move
        ├── Work
        ├── Home
        ├── Supply
        ├── Money
        ├── Coordination
        └── Workforce / Trust
```

The Full Life Constitution is normatively prior to CareOS. The existing Architecture Constitution (`C-*`) continues to govern canonical ownership, authority, AI side effects, consent, provenance, audit and system boundaries.

This design **does not create a parallel RightsOS**. The Constitutional Rights Kernel is a capability layer applying Full Life constitutional safeguards over existing canonical rights and authority systems.

## 1.3 CareOS owns

CareOS owns the cross-programme mission layer:

- participant-stated mission intent;
- desired outcome;
- mission graph;
- mission state and version;
- cross-domain dependencies;
- mission proposals and alternatives;
- mission alerts and disruption state;
- mission recovery coordination;
- mission-level human review requests;
- links to evidence and action receipts;
- participant outcome review.

`CareOSMission` is the intended canonical source of truth for cross-programme mission state.

## 1.4 CareOS does not own

CareOS does not become the source of truth for participant identity, consent or rights policy, delegated authority, Access Passport data, place accessibility observations, provider registration status, worker credentials, worker rostering, transport fleet operations, job applications, clinical records, statutory incident determinations, restrictive-practice authorisation, NDIS eligibility or funding entitlement, participant plan budgets, invoice ledger or payment execution.

Those remain with their canonical owners.

## 1.5 Mission, not case

A mission starts with:

> **What do I want to make happen?**

not:

> **Which programme am I in?**

A mission is not a case file. It can be paused, changed, refused, abandoned, restarted or delegated narrowly. Changing one's mind is a first-class event, not non-compliance.

Example:

```text
Mission: Attend my sister's wedding

Dependencies:
- venue access
- preparation/personal support
- outbound transport
- event support
- communication requirements
- return transport
- recovery/contingency
```

## 1.6 Authority ceiling

CareOS authority is subordinate to participant authority.

```text
CareOS Authority < Participant Authority
```

AI execution authority is zero unless a narrow deterministic capability has been explicitly delegated through a purpose-bound, scoped, time-bounded, revocable authority path.

The normal consequence path is:

```text
AI reasoning
→ structured proposal
→ constitutional checks
→ authority + consent checks
→ participant/human confirmation
→ deterministic domain service
→ action receipt
```

---

# 2. Mission lifecycle and orchestration kernel

## 2.1 Mission lifecycle

```text
PARTICIPANT INTENT
→ DRAFT
→ FRAMED
→ DEPENDENCIES DISCOVERED
→ OPTIONS PREPARED
→ CONSTITUTIONAL ASSESSMENT
→ AUTHORITY / CONSENT CHECK
→ AWAITING PARTICIPANT DECISION
→ CONFIRMED
→ EXECUTING
→ ON TRACK | DISRUPTED
→ RECOVERING
→ OUTCOME REVIEW
→ COMPLETED | ABANDONED
```

`ABANDONED` is not failure. It may simply mean the participant changed their mind. `DISRUPTED` describes a change in the environment, service network, timing, evidence or dependencies; it does not imply participant failure.

## 2.2 Separate state dimensions

Do not overload one `mission.status` field. Keep separate dimensions for:

- **mission state** — draft, confirmed, executing, recovering, completed, abandoned;
- **constitutional status** — pass, warn, block, human review required;
- **participant authority** — not requested, pending, granted, refused, revoked, expired;
- **dependency state** — unresolved, proposed, reserved, confirmed, failed, recovered;
- **workflow state** — waiting, running, retrying, exhausted;
- **domain action state** — domain-specific execution state;
- **evidence state** — unknown, reported, inferred, observed, verified, stale, disputed, revoked.

A transport cancellation changes a dependency, not the person's life goal. Consent withdrawal changes authority, not necessarily mission intent. Stale access evidence changes evidence confidence, not mission state.

## 2.3 Mission graph

A mission is a graph, not merely a checklist. Nodes may represent participant requirements, actions, resources, services, decisions, evidence requirements and outcomes. Edges explain why one node depends on another.

This allows CareOS to calculate affected dependencies after disruption without rebuilding the whole mission.

## 2.4 Mission Orchestration Kernel

The kernel has eight responsibilities:

1. **Intent Framer** — structures a participant objective while preserving the person's original wording.
2. **Dependency Resolver** — identifies what must be true for the outcome to be feasible.
3. **Option Planner** — assembles alternatives without selecting for the participant.
4. **Constitutional Gate** — applies Full Life safeguards and routes ambiguity/high impact to review.
5. **Authority Broker** — verifies purpose, consent, delegate scope and required confirmation.
6. **Action Broker** — converts approved proposals into narrowly scoped deterministic domain commands.
7. **Continuity & Recovery Engine** — generates recovery options when dependencies fail.
8. **Outcome & Evidence Engine** — links what happened back to the participant-defined outcome and evidence.

## 2.5 Mission object concept

```text
CareOSMission
├── identity
│   ├── missionId
│   ├── participantId
│   ├── tenantId
│   └── correlationId
├── purpose
│   ├── participantStatement
│   ├── desiredOutcome
│   └── lifeDomains[]
├── authority
│   ├── authorityDecisionId
│   └── purposeRef
├── orchestration
│   ├── graph
│   ├── dependencies[]
│   ├── proposals[]
│   ├── selectedProposal
│   └── alerts[]
├── runtime
│   ├── missionState
│   ├── stateVersion
│   ├── workflowRunId
│   └── recoveryState
└── evidence
    ├── events[]
    ├── decisions[]
    ├── actionReceipts[]
    ├── humanReviews[]
    └── outcomeReview
```

This extends the current canonical mission direction rather than creating another mission representation.

## 2.6 Domain commands, not cross-domain writes

CareOS must not reach directly into another domain's database. It requests capability through commands such as `REQUEST_CARE_SHIFT`, `REQUEST_ACCESSIBLE_TRIP`, `REQUEST_JOB_APPLICATION_DRAFT`, `REQUEST_VENUE_ACCESS_CHECK` and `REQUEST_INVOICE_REVIEW`.

Commands carry mission, purpose, authority, requirements, correlation, evidence references and confirmation context. The domain decides whether and how the request becomes a valid domain object.

## 2.7 No hidden universal optimisation score

CareOS must not collapse multi-dimensional choices into an opaque scalar. Rights-compatible options should expose meaningful trade-offs including participant preference, access fit, reliability, timing, cost, privacy burden, preferred worker/provider, failure exposure and administrative burden.

Recommendations may be explained, but material trade-offs remain visible.

## 2.8 Mission maxims

> **A mission is successful when the person's chosen objective is advanced—not merely when the system completes its workflow.**

> **When circumstances change, CareOS replans the path before questioning the destination.**

---

# 3. Unified CareOS capability architecture

## 3.1 Consolidation decision

CareOS is not another module beside Care, Transport, Jobs, Marketplace, Access, AbilityPay and Home & Living. Participant-facing products are progressively consolidated into one operating environment while specialised domain ownership remains intact.

```text
CAREOS
│
├── Life Plane
├── Mission Fabric
├── Intelligence Plane
├── Capability Plane
│   ├── Access
│   ├── Care
│   ├── Move
│   ├── Work
│   ├── Home
│   ├── Supply
│   ├── Money
│   ├── Coordinate
│   └── Workforce / Trust
└── Control Plane
    ├── Identity
    ├── Rights
    ├── Authority
    ├── Consent
    ├── Privacy
    ├── Safety
    ├── Messaging
    ├── Evidence
    └── Audit
```

> **Consolidate the product, experience, orchestration and shared infrastructure—not every database table and service into one monolith.**

## 3.2 Existing module destinations

| Existing capability | CareOS destination | End-state role |
| --- | --- | --- |
| MapAble Access | CareOS Access | Access evidence, Access Passport, place/route fit |
| MapAble Navigate | CareOS Access / Move | Accessible routing and journey feasibility |
| MapAble Care | CareOS Care | Support requests, workers, agreements, shifts, recovery |
| MapAble Transport | CareOS Move | Accessible trips, operators, vehicles, disruptions |
| MapAble Jobs | CareOS Work | Employment discovery, application, disclosure, adjustments |
| Home & Living | CareOS Home | Housing discovery, living-support coordination, evidence |
| Marketplace | CareOS Supply | Provider/service/equipment/opportunity discovery |
| AbilityPay | CareOS Money | Quote/invoice/funding context/payment adapter/disputes |
| Support Coordination | CareOS Coordinate | Professional workspace under participant authority |
| Academy | CareOS Workforce / Trust | Training, evidence, competency proposals, workforce readiness |
| Verification/accreditation | CareOS Trust | Provenance, credentials, voluntary verification |
| Messaging/notifications | CareOS Core | Shared communications infrastructure |
| Complaints/incidents | CareOS Support & Safety | Shared entry, governed specialist workflows |
| AI/agents | CareOS Intelligence | Advisory reasoning across CareOS |
| Analytics/outcomes | CareOS Evidence | Mission outcomes and aggregate system learning |

## 3.3 Modular monolith before distributed complexity

CareOS should remain a modular monolith where practical, with explicit internal contracts and bounded domains. Do not initiate a microservice rewrite merely because the product is being consolidated.

Current domain services should be wrapped through capability contracts first. Source-path reorganisation occurs only when it improves maintainability after ownership and contracts are stable.

## 3.4 One canonical concept for shared concerns

CareOS must converge toward one canonical owner for participant identity, organisation identity, provider identity, worker identity, mission, Access Passport, communication preferences, consent, delegate/authority, messaging, notifications, evidence references, complaints intake, incident infrastructure, billing/evidence handoff and audit.

Do not create separate authoritative identities such as `CareParticipant`, `TransportParticipant` and `JobsParticipant` for the same person.

## 3.5 Domain ownership survives consolidation

```text
CareOSMission
├── CareDependency → CareRequest → CareShift
├── MoveDependency → Trip
└── WorkDependency → JobApplication
```

CareOS owns why these things must work together. Care owns the valid shift. Move owns the valid trip. Work owns the valid job application.

## 3.6 Marketplace becomes supply infrastructure

The Marketplace is progressively repositioned as the Supply layer used by missions and discovery. It may find providers, workers, transport operators, community organisations, mainstream services, equipment, housing, jobs and places.

Participant-visible browsing may remain, but supply discovery becomes contextual to missions. Paid placement or commercial ranking must never secretly override rights, access fit, safety or participant preference.

## 3.7 AbilityPay becomes the financial plane

AbilityPay remains a bounded financial authority behind **CareOS Money**. CareOS may explain, compare, flag and request review. It does not autonomously release payment or approve claims.

## 3.8 Support Coordination remains a professional workspace

`CoordinationCase` remains professional support-coordination practice management and is not collapsed into `CareOSMission`. A coordinator may operate on a participant mission only under explicit purpose-bound authority. Professional supervision notes do not automatically become participant mission data.

## 3.9 Access is infrastructural

Accessibility evidence is shared infrastructure across Care, Move, Work, Home, Supply and community participation. CareOS consumes existing Access evidence rather than creating a second accessibility database.

---

# 4. Life Plane — unified participant experience

## 4.1 Navigation principle

> **Navigation reflects what the person is trying to do, not how MapAble's repository is organised.**

The participant should not need to know whether an action belongs to Care, Transport, Jobs, Marketplace, AbilityPay or Access before starting.

## 4.2 Primary navigation

```text
Today
My Life
Missions
Discover
Messages
Money
Support
```

Existing module routes may remain during migration as compatibility paths but stop defining the information architecture.

## 4.3 Today

The default Home surface answers:

- What is happening?
- What changed?
- What needs my attention?
- What can I do next?

It presents cross-domain mission state rather than separate product dashboards.

## 4.4 My Life

`My Life` is participant-controlled context, not a medical dossier. It may project goals, routines, communication preferences, mobility/access requirements, trusted people, delegates, Access Passport, work/study context, home context and privacy choices.

It projects across canonical stores rather than creating a giant `FullLifeProfile` table.

## 4.5 Missions

A mission is the primary workspace for making something happen. It shows participant-stated goal, status, plan/dependencies, what is confirmed/waiting/blocked/unknown, meaningful options, people involved, what information has been shared and why, next decision, recovery state, evidence and outcome review.

## 4.6 Discover

Discovery is universal and intent-based. It may query multiple bounded domains and return one participant-controlled comparison. Functional fit, not diagnosis, is the organising principle.

## 4.7 Messages

One communication environment replaces fragmented participant messaging surfaces. Conversations may relate to missions, shifts, trips, applications, home enquiries, invoices, complaints or support requests. Context and disclosure must remain visible.

## 4.8 Money

CareOS Money unifies participant-facing quote, cost, invoice, funding-context, payment and dispute journeys while preserving AbilityPay as the financial domain. Estimate, funding context, claimability, approval and actual payment state remain distinct.

## 4.9 Evidence is explainable

Participants can inspect why CareOS says something, where evidence came from, how recent it is, its verification state and how to correct or challenge it.

## 4.10 Support is permanently reachable

Human help remains persistently available for accessibility assistance, technical support, service recovery, complaints, safety concerns, advocacy/support pathways and decision support. Safety, complaints, incidents and ordinary customer service must not collapse into an undifferentiated queue.

## 4.11 Progressive disclosure

Default screens show:

```text
what matters now
+
what changed
+
what requires a decision
```

Detailed audit, evidence, credentials, pricing and recovery information remain available without dominating the default view.

## 4.12 Explicit accessibility preferences

CareOS may support participant-selected larger targets, lower information density, high contrast, reduced motion, captions, AAC-oriented quick responses, longer confirmation timeouts, keyboard-first flow, screen-reader-optimised ordering, voice assistance and alternative communication formats.

CareOS must not infer cognitive capacity from interaction behaviour.

## 4.13 Delegation is visible and reversible

CareOS makes clear who is acting, under what authority and which actions are permitted. Delegation remains scoped, purpose-bound, reviewable, expirable and revocable.

## 4.14 Life Plane maxim

> **The participant navigates their life. CareOS navigates the systems.**

---

# 5. Capability consolidation and migration architecture

## 5.1 Consolidation vocabulary

- **Retain** — existing subsystem remains canonical for a specialist domain.
- **Absorb** — capability survives but participant-facing experience moves into CareOS.
- **Merge** — duplicate/shared capability becomes one CareOS Core service.
- **Adapt** — specialist/professional/external subsystem remains behind a governed contract.
- **Deprecate** — stop new development on the old surface while maintaining compatibility.
- **Retire** — remove only after migration, parity, evidence, rollback period and no authoritative dependency remains.

## 5.2 Consolidation map

| Subsystem | Destination | Disposition |
| --- | --- | --- |
| Access | CareOS Access | Retain + absorb |
| Care | CareOS Care | Retain + absorb |
| Transport | CareOS Move | Retain + absorb |
| Jobs | CareOS Work | Retain + absorb |
| Marketplace | CareOS Supply / Discover | Absorb + adapt |
| AbilityPay | CareOS Money | Retain + absorb |
| Home & Living | CareOS Home | Retain + absorb |
| Support Coordination | Professional CareOS workspace | Adapt |
| Academy / Workforce Passport | CareOS Workforce & Trust | Adapt + merge evidence |
| Messaging | CareOS Core Messaging | Merge |
| Notifications | CareOS Core Notifications | Merge |
| Documents/Evidence | CareOS Evidence Fabric | Merge references; retain specialist records |
| Safety/Complaints/Incidents | CareOS Support & Safety | Merge entry; retain governed workflows |
| AI/Cases/Agents | CareOS Intelligence Plane | Consolidate; deprecate duplicate AI products |
| Consent/Delegates/Privacy | CareOS Control Plane | Merge experience; retain canonical stores |

## 5.3 Capability contract

Every bounded domain should expose a consistent conceptual contract where applicable:

```text
DISCOVER
→ ASSESS_FIT
→ PROPOSE
→ QUOTE / CONDITIONS
→ RESERVE (optional)
→ CONFIRM
→ EXECUTE
→ STATUS
→ EVIDENCE
→ CHANGE / CANCEL
→ RECOVERY_OPTIONS
```

Commands include mission, participant, purpose, authority, consent, correlation, idempotency, requested capability and minimum necessary disclosure. Consequential results return status, domain-object reference, evidence, effective time, limitations, next actions and recovery capability.

## 5.4 Migration waves

### Wave 0 — semantic inventory
Register canonical owners and duplicate candidates. No new parallel mission, participant, consent, provider, worker, place, invoice, incident or audit systems.

### Wave 1 — CareOS shell
Introduce the unified Life Plane navigation over existing services. No data migration or execution-semantics change.

### Wave 2 — unified read plane
Aggregate existing domain state into Today and Missions without moving source-of-truth records.

### Wave 3 — capability contracts
Introduce typed adapters for Care, Move, Work, Home, Supply, Money and Access.

### Wave 4 — mission command plane
Approved actions flow through constitutional, authority, consent and confirmation gates before deterministic domain execution and action receipt.

### Wave 5 — continuity and events
Domain events update mission dependencies and feed recovery.

### Wave 6 — UX convergence
Legacy participant routes become compatibility routes into CareOS after parity testing.

### Wave 7 — data rationalisation
Remove genuinely duplicate stores only after ownership and contracts are stable.

### Wave 8 — retirement
Retire legacy surfaces only after functional parity, data integrity, accessibility acceptance, security tests, authority tests, migration evidence, observability, rollback period and human approval.

## 5.5 No big-bang directory move

Do not mechanically move `lib/care`, `lib/transport` or `lib/jobs` under `lib/careos` before contracts and ownership are stable. Architecture precedes folder aesthetics.

## 5.6 Consolidation invariants

1. One participant-facing CareOS.
2. One canonical owner per concept.
3. No cross-domain database writes.
4. CareOS owns missions; domains own execution.
5. Shared concerns live in Core.
6. AI proposes; deterministic services execute.
7. Consequential actions carry explicit authority and purpose.
8. Capabilities expose evidence and recovery semantics.
9. Legacy routes disappear only after verified parity.
10. Consolidation must never weaken participant control, accessibility, privacy, auditability or safety.

---

# 6. Intelligence Plane and agentic architecture

## 6.1 Reasoning fabric, not super-agent

CareOS should not have one unconstrained agent with direct access to every domain. Use bounded capabilities such as Intent Framer, Dependency Reasoner, Access Reasoner, Care Reasoner, Move Reasoner, Work Reasoner, Resource Reasoner, Recovery Planner, Evidence Interpreter and Communication Assistant.

An agent is an implementation technique, not a grant of authority.

## 6.2 Mission Reasoning Kernel

Input combines participant intent, purpose-authorised Full Life context, access requirements, mission graph, domain capabilities, evidence and constraints.

Output is a non-executable `MissionProposal` containing objective, assumptions, dependencies, unresolved questions, options, rights flags, evidence references, uncertainties and recommended next step.

## 6.3 Typed reasoning envelope

Consequential AI output leaves the model as typed structured data including proposal ID, mission ID, purpose, generation time, model/provider metadata, claims with evidence references and claim state, assumptions, unknowns, options, constitutional flags, required human reviews and prohibited actions.

## 6.4 Constitutional enforcement is outside the model

AI may reason about rights but is not trusted to enforce the Constitution alone. Deterministic checks must block prohibited social-worth scoring, unknown access promoted to accessible, missing consent, insufficient delegate scope, AI payment approval and prohibited clinical/funding/statutory automation. Ambiguous rights questions route to human review.

## 6.5 Intelligence never owns mission state

Target:

```text
Intelligence
→ MissionProposal
→ Mission Command Service
→ CareOSMission
```

Model/agent components must not write directly to Prisma `CareOSMission`. Existing direct intelligence mission writes are convergence debt.

## 6.6 Model independence

Use a model-gateway boundary so mission semantics, domain contracts and authority controls do not depend on one model vendor.

## 6.7 Minimum necessary context

Each reasoning call receives only the context required for its declared purpose. Cross-domain consolidation must not become full-profile disclosure to the model.

## 6.8 Participant-owned memory vs AI memory

Canonical participant facts and preferences belong in explicit participant-controlled stores when saved. Model inference and conversational memory do not silently become participant facts. Inference remains inference.

## 6.9 Recovery intelligence

AI may analyse failures and generate recovery options. Participant-relevant substitutions remain subject to rights, authority, consent and confirmation.

## 6.10 Human review is first-class

Use explicit `HumanReviewRequest` objects containing mission, question, reason, evidence, AI analysis, uncertainty, participant preference, deadline where relevant and permitted reviewer role.

## 6.11 Advisory and governed-action modes

**Advisory mode:** AI explains, compares, drafts and recommends; no external consequence.

**Governed action mode:** an approved proposal becomes a deterministic action token and domain service command. The model still does not execute the consequence.

## 6.12 AI-off parity

Every core participant journey remains usable with AI disabled. Mission model, authority, capability contracts, deterministic actions, evidence and recovery still work.

## 6.13 Evaluation hierarchy

AI assurance tests rights, authority, evidence grounding, uncertainty, accessibility, privacy/minimum context, action safety, recovery behaviour, fairness/no social-worth ranking and AI-off parity.

## 6.14 Prompt injection boundary

External content from websites, providers, documents, messages and partner APIs is untrusted data, never authority-bearing instruction.

## 6.15 Intelligence maxim

> **CareOS may think ahead of the participant; it may never decide above the participant.**

---

# 7. Rights, authority, consent and safety Control Plane

## 7.1 Runtime authority model

```text
Actor
+
Participant
+
Purpose
+
Domain
+
Action
+
Scope
+
Time
+
Conditions
=
AuthorityDecision
```

Authentication is not authority. Organisation membership is not participant authority. Role labels do not create blanket authority.

## 7.2 Consent is action-specific

Consent is tied to subject, recipient, purpose, information classes, mission/context, validity period, revocability, authority basis and disclosure/action receipt. Broad generic consent is not permission for unrelated future purposes.

## 7.3 Supported decision-making is not delegation

```text
SUPPORT_FOR_DECISION
≠
AUTHORITY_TO_DECIDE
```

A supporter may help a person understand, communicate, use AAC or express a choice without acquiring authority to decide.

## 7.4 Safety does not create blanket override authority

CareOS may surface safety information and trigger warning, pause, review or escalation paths. It does not automatically acquire authority to override the participant. Safety safeguards should be the least restrictive transparent measure compatible with lawful obligations and dignity of risk.

## 7.5 Restricted autonomous decisions

Autonomous AI determination is prohibited for NDIS eligibility, funding entitlement, payment approval, claim approval, legal capacity determination, restrictive-practice authorisation, abuse finding, statutory incident reportability, clinical diagnosis/treatment, provider/worker selection where participant confirmation is required, and sensitive employment disclosure.

## 7.6 Control Plane maxim

> **Authority follows the person, the purpose and the decision—not the software component asking to act.**

---

# 8. Evidence Graph, events, continuity and recovery

## 8.1 Evidence Graph

A shared evidence vocabulary should reference subject, value, source, observed/reported time, verification method, evidence state, freshness/expiry, dispute state and supporting references.

Recommended evidence states:

```text
UNKNOWN
REPORTED
INFERRED
OBSERVED
VERIFIED
STALE
DISPUTED
REVOKED
```

Evidence moves to a stronger state only because stronger evidence was obtained, never because a model is confident.

## 8.2 Event Fabric

Important mission/domain events carry event ID, type, occurrence time, actor, mission ID, domain-object reference, correlation ID, causation ID, provenance and synthetic/test marker where relevant.

## 8.3 Distinct event records

Preserve:

```text
CareOSMissionEvent = participant mission history
CloudEventOutbox    = integration delivery
AuditEvent          = security / authority / data-access evidence
```

Do not collapse these into a universal event table.

## 8.4 Dependency propagation

Domain events update affected mission dependencies and downstream risk state. A failed dependency does not automatically invalidate the participant's goal.

## 8.5 Recovery classes

Distinguish automatic technical retry, participant-neutral operational recovery, participant-relevant substitution, safety escalation and no feasible recovery. Participant-relevant substitutions require renewed choice/confirmation where material.

## 8.6 Causal attribution

CareOS may record system causes such as provider cancellation, vehicle failure, inaccessible entrance, market-capacity shortage, stale information, outage or scheduling conflict. It must not turn these into participant reliability, worth or compliance scores.

## 8.7 Recovery maxim

> **CareOS recovers the plan, not the person.**

---

# 9. Security, accessibility, operations and governance

## 9.1 Security model

CareOS uses least privilege, no implicit cross-domain trust, purpose-bound data access, tenant isolation, strong authentication, explicit participant authority, append-only audit/evidence where required, idempotent deterministic action tokens, replay protection and secure adapter boundaries.

Every sensitive request must answer who is acting, for whom, for what purpose, under which authority, which information is needed and how long the authority/data use remains valid.

## 9.2 Required security tests

Critical paths require tests for cross-participant IDOR, cross-tenant access, delegate-scope bypass, stale-authority reuse, consent-revocation races, replayed action tokens, duplicate financial actions, forged webhooks, prompt injection, malicious-document instructions, event replay and mission multi-writer violations.

## 9.3 Accessibility is a release gate

Critical journeys require **WCAG 2.2 AA plus real assistive-technology acceptance testing**, not automated scanning alone.

Acceptance should exercise keyboard-only operation, screen readers, zoom/reflow, focus visibility/order, accessible names/semantics, status announcements, timeouts/extensions, error recovery, reduced motion, plain language, AAC-oriented interaction, alternative communication and accessible human fallback.

At least two meaningful assistive-technology/browser combinations should be used for release acceptance of critical journeys.

## 9.4 Observability

Observability exists at four levels:

```text
SYSTEM
DOMAIN
MISSION
PARTICIPANT IMPACT
```

Engineering telemetry should detect not only service health but mission impact, subject to privacy and least privilege.

## 9.5 Graceful degradation

- AI unavailable → manual journey remains.
- Event delivery failure → durable replay.
- External provider API unavailable → unavailable/unknown plus manual path.
- Accessibility evidence missing → unknown.
- Critical service interruption → defined continuity path appropriate to the service.

## 9.6 Governance classes

CareOS uses product, architecture, rights, security/privacy, accessibility, safety/safeguarding, model and operational governance, plus financial controls where relevant. Review burden increases with potential consequence.

## 9.7 Constitutional amendment process

```text
proposed amendment
→ reason + evidence
→ rights-impact analysis
→ disabled-person / participant review
→ architecture implications
→ versioned approval
→ new constitutional version
```

Historical mission/evaluation evidence retains the constitutional version that applied.

---

# 10. Definition of Done, delivery gates and programme sequence

## 10.1 Consequential capability Definition of Done

A consequential capability is production-complete only when it has participant value demonstrated, canonical ownership, enforced authority, purpose/consent controls, implemented domain contract, accessibility acceptance, security tests, AI-off parity, evidence/provenance, recovery path, audit evidence, rollback and public claims aligned to evidence.

Anything less may still be labelled prototype, in development or implemented-but-unverified, but not production-complete.

## 10.2 Reference vertical slice

The first representative CareOS vertical slice is:

> **Attend an appointment with personal support and accessible transport.**

This exercises participant intent, access requirements, mission graph, Care, Move, timing, authority, consent, discovery, comparison, participant selection, deterministic execution, events, failure, recovery, evidence and outcome review.

The same core journey must work with AI disabled.

## 10.3 Architectural acceptance scenario

```text
Participant: “I need to attend an appointment Friday.”

CareOS understands the goal
→ confirms important requirements
→ constructs mission graph
→ identifies Care + Move dependencies
→ finds rights-compatible options
→ shows material trade-offs
→ participant chooses
→ purpose / authority / consent verified
→ Care + Move execute through their domains
→ mission receives evidence
→ worker cancels
→ CareOS produces recovery options
→ participant chooses replacement
→ transport timing adjusts
→ appointment occurs
→ participant reviews outcome
```

## 10.4 Programme sequence

```text
P0   Constitutional + canonical ownership convergence
P1   Mission single-writer convergence
P2   CareOS Life Plane — read-only aggregation
P3   Authority / consent / disclosure Control Plane
P4   Capability contracts
P5   Care + Move reference mission
P6   Intelligence + recovery
P7   Evidence Graph + event reliability
P8   Work integration
P9   Home + Supply + Money integration
P10  Legacy participant-surface retirement
P11  Multi-scheme / lifespan expansion
P12  Partner / enterprise packaging
```

Do not run all streams as parallel broad engineering programmes.

---

# 11. Repository convergence requirements

## 11.1 Mission single-writer boundary

Current `main` contains a canonical mission service but also direct mission writes from intelligence paths.

Target:

```text
UI / AI / domain
→ MissionCommand
→ CanonicalMissionService
→ CareOSMission
```

Direct AI/agent writes to `CareOSMission` are prohibited in the target architecture.

## 11.2 Documentation reconciliation

Some programme documents describe `CareOSMission` as absent or adapter-backed while current main contains a canonical service and migration. Current code and migrations take precedence. Stale documentation must be corrected or explicitly marked historical during convergence.

## 11.3 Intelligence-tree convergence

Current CareOS analysis identifies duplicate intelligence trees and prohibited-use/flag drift. Converge them behind one CareOS Intelligence boundary without creating a third tree.

## 11.4 Evidence convergence

Access, transport, accreditation/Mark, workforce and domain evidence should converge on common provenance semantics and a shared Evidence Graph API without prematurely copying all specialist records into a new graph store.

## 11.5 Event reliability

The outbox/event relay must become durable enough to support mission recovery and status projection before broad live orchestration depends on it.

---

# 12. Intentional non-features

CareOS does not pursue automated NDIS eligibility, autonomous funding entitlement decisions, autonomous claim/payment approval, diagnosis or treatment decisions, restrictive-practice automation, AI capacity determinations, autonomous provider/worker selection where participant confirmation is required, participant risk/social-worth/productivity/deservingness/life-value scoring, production physical assistive-technology actuation, a second Core platform, a second RightsOS, a second Access Passport, a duplicate participant identity system, a universal single-table event store, a big-bang microservice rewrite, a big-bang database migration, a giant participant `FullLifeProfile` table or hidden single-score welfare optimisation.

Research may explore future possibilities, but these boundaries remain closed unless separately redesigned, governed and explicitly approved.

---

# 13. Resource stewardship and option comparison

CareOS compares resources only among rights-compatible options.

```text
Rights floor / compatibility
→ Essential sufficiency
→ Will and preferences
→ Barrier removal
→ Capability expansion
→ Distributional equity
→ Cost efficiency
```

For an individual mission, CareOS compares options for that same person's goal. It must not compare people by social worth.

A rights-compatible option may expose a multi-dimensional vector such as participant preference, capability gain, equity effect, safety, reliability, accessibility, privacy burden, administrative burden, direct cost, whole-system cost and sustainability. CareOS should surface dominance and trade-offs rather than hiding them behind one opaque score.

Aggregate policy simulation is separate from participant runtime, de-identified/appropriately governed, advisory and prohibited from becoming a cross-person deservingness engine.

---

# 14. Evidence and claim-state discipline

Use the MapAble claim-state vocabulary:

- **Verified live** — directly observed in production/deployment/authoritative evidence.
- **Implemented, not independently verified** — present in code/configuration but not proven live.
- **In development** — active work exists but is incomplete or gated.
- **Proposed** — approved/documented design with no implementation proof.
- **Exploratory** — concept requiring validation.
- **Historical** — older plan or snapshot that may no longer be current.

At this design date:

- this consolidated CareOS architecture is **Proposed**;
- the canonical `CareOSMission` service/migration are **Implemented, not independently verified** in production;
- broad cross-domain live orchestration is not established as production-complete by this document;
- Full Life constitutional architecture remains **Proposed**, not proof of deployed enforcement;
- historical roadmaps and pitch material remain evidence of intent, not implementation status.

---

# 15. Implementation-plan decomposition

This blueprint is intentionally too broad for one implementation plan. It must be decomposed into independently testable sub-projects:

1. **CareOS Constitutional & Architecture Convergence** — canonical owners, mission single-writer, documentation reconciliation, intelligence convergence and architecture guardrails.
2. **CareOS Life Plane** — Today, My Life, Missions, Discover, Messages, Money, Support and compatibility routes.
3. **Mission Fabric + Capability Contracts** — mission graph, dependencies, capability interfaces, mission command boundary and domain adapters.
4. **Rights, Authority & Consent Control Plane** — authority decisions, consent, delegate scope, disclosure receipts, human review and revocation propagation.
5. **Care + Move Reference Mission** — appointment goal, support and accessible transport dependencies, comparison, confirmation, execution, recovery and outcome review.
6. **CareOS Intelligence + Constitutional Evaluations** — model gateway, typed proposals, bounded reasoners, deterministic constitutional checks, eval harness, prompt-injection boundary and AI-off parity.
7. **Evidence Graph + Recovery Fabric** — provenance, evidence state, events, outbox reliability, dependency propagation, recovery and causal attribution.
8. **Domain Consolidation & Legacy Retirement** — Work, Home, Supply, Money, Coordination, Workforce/Trust, redirects, parity and legacy retirement.

Each sub-project receives its own plan and, where architectural scope warrants it, its own sub-spec. Do not create one giant CareOS implementation branch.

---

# 16. Final architectural invariants

1. The participant defines the destination; CareOS helps assemble and maintain the path.
2. CareOS carries coordination burden without taking away participant authority.
3. One life, one operating environment, many bounded capabilities.
4. The participant navigates their life; CareOS navigates the systems.
5. CareOS owns cross-programme mission state; domains own execution.
6. Shared Core capabilities are built once.
7. Models produce proposals, not authority.
8. Rights and authority checks exist outside the model.
9. No consequential cross-domain database writes.
10. Unknown remains unknown; inference remains inference.
11. Accessibility is a release criterion, not an enhancement.
12. Support for decision-making is not authority to decide.
13. Recovery fixes the path before questioning the person's destination.
14. Evidence includes provenance, recency, uncertainty and contestability.
15. Efficiency may compare rights-compatible means; it may not decide whose rights matter.
16. Consolidation unifies participant experience without erasing accountable domain boundaries.
17. Every core journey remains possible without AI.
18. Public claims may not exceed deployed evidence.

---

# 17. Design review checklist

Before implementation planning, reviewers should confirm:

- Full Life Constitution remains the normative parent layer;
- no parallel RightsOS, Core, mission store, identity store or Access Passport is introduced;
- `CareOSMission` has one intended writer boundary;
- Life Plane navigation is participant-goal oriented rather than module oriented;
- domain ownership remains explicit;
- AI has no implicit consequential authority;
- consent/authority are purpose-bound and revocable;
- accessibility acceptance includes real assistive-technology testing;
- AI-off parity is preserved;
- evidence states preserve unknown/inference distinctions;
- recovery distinguishes technical retry from participant-relevant substitution;
- Support Coordination remains professional practice management, not ownership of participant life;
- Resource Stewardship avoids hidden social-worth or cross-person ranking;
- execution is decomposed into short-lived, independently testable sub-projects;
- stale repository documentation is reconciled before use as implementation truth.

---

## Closing statement

CareOS is not intended to automate a person's life. It is intended to make the systems around that life more coherent, accessible, explainable, reliable and recoverable while preserving the person's authorship of their own decisions.

> **MapAble optimises systems around the person; it never optimises the person to fit the system.**
