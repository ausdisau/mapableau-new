# CareOS Blueprint — Consolidated Design

**Status:** Proposed architecture; design-approved in conversation, pending repository review. This document does not itself change production behaviour, registration status, legal authority, payment authority, NDIS entitlement logic, or public capability claims.

**Date:** 2026-09-12

**Repository baseline inspected:** `main` at `3810fe810301ba73f855cd8ba4cfc2adf23eb9d3`

**Parent design:** `docs/superpowers/specs/2026-09-10-full-life-os-constitutional-design.md`

## Decision

Consolidate MapAble's existing participant-facing modules into **CareOS**, a participant-controlled Full Life Orchestrator inside the broader MapAble Full Life OS.

CareOS becomes the single participant-facing operating environment for coordinating goals, missions, accessibility, support, mobility, work, home, discovery, money, communication, evidence, recovery, and human support. Existing specialised domains remain bounded, authoritative engines behind CareOS rather than being flattened into a single monolith.

The architectural doctrine is:

> **One life. One operating environment. Many bounded capabilities.**

> **The participant navigates their life; CareOS navigates the systems.**

> **Models propose. Rights constrain. Authority permits. People decide. Deterministic systems act. Evidence records what happened.**

> **When something fails, CareOS repairs the path before questioning the person's destination.**

---

# 1. Scope, purpose, and architectural position

## 1.1 CareOS is the Full Life mission fabric

CareOS is the participant-controlled orchestration layer under the Full Life Constitution and Constitutional Rights Kernel.

Its central responsibility is:

> **Turn a participant-defined life objective into a safe, rights-compatible, understandable, and recoverable sequence of coordinated actions across systems.**

CareOS is not primarily a provider-management platform, case-management platform, roster system, transport-dispatch system, ATS, plan-management ledger, clinical record, or NDIS entitlement engine.

CareOS is the **executive-function layer**, not executive authority. It carries computational coordination burden—remembering, checking, connecting, anticipating, comparing, explaining, and recovering—while leaving choosing, consenting, refusing, changing one's mind, and defining what matters with the person.

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

The Full Life Constitution is normatively prior to CareOS. The existing Architecture Constitution (`C-*`) continues to govern canonical ownership, authority, AI side effects, consent, provenance, audit, and system boundaries.

This design **does not create a parallel RightsOS**. The Constitutional Rights Kernel is a capability layer that applies the Full Life constitutional safeguards over existing canonical rights and authority systems.

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

CareOS does not become the source of truth for:

- participant identity;
- consent or rights policy;
- delegated authority;
- Access Passport data;
- place accessibility observations;
- provider registration status;
- worker credentials;
- worker rostering;
- transport fleet operations;
- job applications;
- clinical records;
- statutory incident determinations;
- restrictive-practice authorisation;
- NDIS eligibility or funding entitlement;
- participant plan budgets;
- invoice ledger or payment execution.

Those remain with their canonical owners.

## 1.5 Mission, not case

A mission starts with:

> **What do I want to make happen?**

not:

> **Which programme am I in?**

A mission is not a case file. It can be paused, changed, refused, abandoned, restarted, or delegated narrowly. Changing one's mind is a first-class event, not non-compliance.

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

The mission lifecycle is:

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

`ABANDONED` is not failure. It may simply mean the participant changed their mind.

`DISRUPTED` does not imply participant failure. It describes a change in the environment, service network, timing, evidence, or dependencies.

## 2.2 Separate state dimensions

Do not overload one `mission.status` field with unrelated concepts.

Keep separate dimensions for:

- **mission state** — draft, confirmed, executing, recovering, completed, abandoned;
- **constitutional status** — pass, warn, block, human review required;
- **participant authority** — not requested, pending, granted, refused, revoked, expired;
- **dependency state** — unresolved, proposed, reserved, confirmed, failed, recovered;
- **workflow state** — waiting, running, retrying, exhausted;
- **domain action state** — domain-specific execution status;
- **evidence state** — unknown, reported, inferred, observed, verified, stale, disputed, revoked.

Examples:

- a transport cancellation changes a dependency, not the person's life goal;
- consent withdrawal changes authority, not necessarily mission intent;
- stale access evidence changes evidence confidence, not mission state.

## 2.3 Mission graph

A mission is a graph, not merely a checklist.

Nodes may represent:

- participant requirements;
- actions;
- resources;
- services;
- decisions;
- evidence requirements;
- outcomes.

Edges explain why one node depends on another.

This allows CareOS to calculate the effect of disruption without rebuilding the whole plan.

## 2.4 Mission Orchestration Kernel

The kernel has eight responsibilities:

1. **Intent Framer** — structures a participant objective while preserving the person's original wording.
2. **Dependency Resolver** — identifies what must be true for the outcome to be feasible.
3. **Option Planner** — assembles alternatives without selecting for the participant.
4. **Constitutional Gate** — applies Full Life constitutional safeguards and routes ambiguity/high impact to review.
5. **Authority Broker** — verifies purpose, consent, delegate scope, and required confirmation.
6. **Action Broker** — converts approved proposals into narrowly scoped deterministic domain commands.
7. **Continuity & Recovery Engine** — generates recovery options when dependencies fail.
8. **Outcome & Evidence Engine** — links what happened back to the participant-defined outcome and its evidence.

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

CareOS must not reach directly into another domain's database.

It requests capability through commands such as:

```text
REQUEST_CARE_SHIFT
REQUEST_ACCESSIBLE_TRIP
REQUEST_JOB_APPLICATION_DRAFT
REQUEST_VENUE_ACCESS_CHECK
REQUEST_INVOICE_REVIEW
```

Each command carries mission, purpose, authority, requirements, correlation, evidence references, and confirmation context.

The domain decides whether and how the request becomes a valid domain object.

## 2.7 No hidden universal optimisation score

CareOS must not collapse multi-dimensional choices into a hidden participant-facing scalar such as `Option A = 87.4`.

Rights-compatible options should expose meaningful trade-offs such as:

- participant preference;
- access fit;
- reliability;
- timing;
- cost;
- privacy burden;
- preferred worker/provider;
- failure exposure;
- administrative burden.

Recommendations may be explained, but material trade-offs remain visible.

## 2.8 Mission maxims

> **A mission is successful when the person's chosen objective is advanced—not merely when the system completes its workflow.**

> **When circumstances change, CareOS replans the path before questioning the destination.**

---

# 3. Unified CareOS capability architecture

## 3.1 Consolidation decision

CareOS is not another module beside Care, Transport, Jobs, Marketplace, Access, AbilityPay, and Home & Living.

The participant-facing products are progressively consolidated into one operating environment while specialised domain ownership remains intact.

```text
CAREOS
│
├── Life Plane
│
├── Mission Fabric
│
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
│
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

The rule is:

> **Consolidate the product, experience, orchestration, and shared infrastructure—not every database table and service into one monolith.**

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

CareOS should remain a modular monolith where practical, with explicit internal contracts and bounded domains.

Do not initiate a microservice rewrite merely because the product is being consolidated.

Current domain services should be wrapped through capability contracts first. Source-path reorganisation occurs only when it improves maintainability after ownership and contracts are stable.

## 3.4 One canonical concept for shared concerns

CareOS must converge toward one canonical owner for each shared concept:

- participant identity;
- organisation identity;
- provider identity;
- worker identity;
- mission;
- Access Passport;
- communication preference model;
- consent architecture;
- delegate/authority model;
- messaging fabric;
- notification engine;
- document/evidence references;
- complaint entry point;
- incident infrastructure;
- billing/evidence handoff;
- audit spine.

Do not create separate authoritative identities such as `CareParticipant`, `TransportParticipant`, and `JobsParticipant` for the same person.

## 3.5 Domain ownership survives consolidation

Example:

```text
CareOSMission
├── CareDependency → CareRequest → CareShift
├── MoveDependency → Trip
└── WorkDependency → JobApplication
```

CareOS owns why these things must work together.

Care owns the valid shift.

Move owns the valid trip.

Work owns the valid job application.

## 3.6 Marketplace becomes supply infrastructure

The Marketplace is progressively repositioned as the Supply layer used by missions and discovery.

It may find:

- registered providers;
- independent workers;
- transport operators;
- community organisations;
- mainstream services;
- equipment;
- housing;
- jobs;
- places.

Participant-visible browsing may remain, but supply discovery becomes contextual to missions.

Paid placement or commercial ranking must never secretly override rights, access fit, safety, or participant preference.

## 3.7 AbilityPay becomes the financial plane

AbilityPay remains a bounded financial authority behind **CareOS Money**.

CareOS may explain, compare, flag, and request review. It does not autonomously release payment or approve claims.

## 3.8 Support Coordination remains a professional workspace

`CoordinationCase` remains professional support-coordination practice management and is not collapsed into `CareOSMission`.

A coordinator may operate on a participant mission only under explicit purpose-bound authority.

Professional supervision notes do not automatically become participant mission data.

## 3.9 Access is infrastructural

Accessibility evidence is a shared infrastructure layer across Care, Move, Work, Home, Supply, and community participation.

CareOS must consume existing Access evidence rather than creating a second accessibility database.

---

# 4. Life Plane — unified participant experience

## 4.1 Navigation principle

> **Navigation reflects what the person is trying to do, not how MapAble's repository is organised.**

The participant should not need to know whether an action belongs to Care, Transport, Jobs, Marketplace, AbilityPay, or Access before starting.

## 4.2 Primary participant navigation

The target primary navigation is:

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

The default Home surface should answer:

- What is happening?
- What changed?
- What needs my attention?
- What can I do next?

Example:

```text
TODAY
08:30  Morning support        Confirmed
10:00  Trip to work           Accessible vehicle confirmed
11:00  Work                   Main entrance lift recently verified
17:00  Trip home               Review vehicle change

NEEDS YOUR ATTENTION
Replacement vehicle has less verified access information.
[Review options]

YOUR MISSIONS
Starting my new job           On track
Sister's wedding              Planning
Move closer to university     Comparing options
```

## 4.4 My Life

`My Life` is participant-controlled context, not a medical dossier.

It may project:

- goals;
- routines;
- communication preferences;
- mobility/access requirements;
- trusted people;
- delegates;
- Access Passport;
- work/study context;
- home context;
- privacy choices.

It should project across canonical stores instead of creating a giant `FullLifeProfile` table.

## 4.5 Missions

A mission is the primary workspace for making something happen.

It shows:

- participant-stated goal;
- status;
- plan/dependencies;
- what is confirmed/waiting/blocked/unknown;
- options and material trade-offs;
- people involved;
- what information has been shared and why;
- next decision;
- recovery state;
- evidence and outcome review.

## 4.6 Discover

Discovery is universal and intent-based.

Queries such as:

- find an accessible place for dinner;
- find a support worker who understands AAC;
- show jobs I can get to independently;
- find accessible housing near transport;
- find a wheelchair-accessible trip for Friday;

may query multiple bounded domains and return one participant-controlled comparison.

Discovery should evaluate functional fit rather than making diagnosis the organising principle.

## 4.7 Messages

One communication environment should replace fragmented participant messaging surfaces.

A conversation can relate to a mission, shift, trip, application, home enquiry, invoice, complaint, or support request.

The interface must make context and disclosure visible.

## 4.8 Money

CareOS Money unifies participant-facing quote, cost, invoice, funding-context, payment, and dispute journeys while preserving AbilityPay as the financial domain.

CareOS must distinguish estimate, funding context, claimability, approval, and actual payment state.

## 4.9 Evidence is explainable

Participants must be able to inspect:

- why CareOS says something;
- where evidence came from;
- how recent it is;
- whether it is reported, inferred, observed, verified, stale, or disputed;
- how to correct or challenge it.

## 4.10 Support is permanently reachable

Human help must be persistently available for:

- accessibility assistance;
- technical support;
- service recovery;
- complaints;
- safety concerns;
- advocacy/support pathways;
- human decision support.

Safety, complaints, incidents, and ordinary customer service must not be collapsed into one undifferentiated queue.

## 4.11 Progressive disclosure

A consolidated OS can become cognitively overwhelming. Default screens therefore show:

```text
what matters now
+
what changed
+
what requires a decision
```

Detailed audit, evidence, credentials, pricing, and recovery data remain available without dominating the default view.

## 4.12 Accessibility adapts to explicit preference

CareOS may support explicit participant-selected preferences such as:

- larger targets;
- lower information density;
- high contrast;
- reduced motion;
- persistent captions;
- AAC quick responses;
- longer confirmation timeouts;
- keyboard-first flow;
- screen-reader-optimised ordering;
- voice-assisted navigation;
- alternative communication formats.

CareOS must not infer cognitive capacity from interaction behaviour.

## 4.13 Delegation is visible and reversible

CareOS must always make clear who is acting, under what authority, and which actions are permitted.

Delegation remains scoped, purpose-bound, reviewable, expirable, and revocable.

## 4.14 Life Plane maxim

> **The participant navigates their life. CareOS navigates the systems.**

---

# 5. Capability consolidation and migration architecture

## 5.1 Consolidation vocabulary

Use six explicit migration dispositions:

- **Retain** — existing subsystem remains canonical for a specialist domain.
- **Absorb** — capability survives but participant-facing experience moves into CareOS.
- **Merge** — duplicate/shared capability becomes one CareOS Core service.
- **Adapt** — specialist/professional/external subsystem remains behind a governed contract.
- **Deprecate** — stop new development on the old surface while maintaining compatibility.
- **Retire** — remove only after migration, parity, evidence, rollback period, and no authoritative dependency remains.

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

Commands include:

- mission;
- participant;
- purpose;
- authority;
- consent;
- correlation;
- idempotency;
- requested capability;
- minimum necessary disclosure.

Consequential results return:

- status;
- domain object reference;
- evidence;
- effective time;
- limitations;
- next actions;
- recovery capability.

## 5.4 Migration waves

### Wave 0 — semantic inventory

Register canonical owners and duplicate candidates. No new parallel mission, participant, consent, provider, worker, place, invoice, incident, or audit systems.

### Wave 1 — CareOS shell

Introduce the unified Life Plane navigation over existing services. No data migration or execution-semantics change.

### Wave 2 — unified read plane

Aggregate existing domain state into Today and Missions without moving source-of-truth records.

### Wave 3 — capability contracts

Introduce typed adapters for Care, Move, Work, Home, Supply, Money, and Access.

### Wave 4 — mission command plane

Approved mission actions flow through constitutional, authority, consent, confirmation, deterministic capability command, domain execution, and action receipt.

### Wave 5 — continuity and events

Domain events update mission dependency state and feed the recovery engine.

### Wave 6 — UX convergence

Legacy participant routes become compatibility routes into CareOS surfaces after parity testing.

### Wave 7 — data rationalisation

Remove genuinely duplicate data stores only after canonical ownership and domain contracts are stable.

### Wave 8 — retirement

Legacy surfaces retire only after functional parity, data integrity, accessibility acceptance, security tests, authority tests, migration evidence, observability, rollback period, and human approval.

## 5.5 No big-bang directory move

Do not start by mechanically moving `lib/care`, `lib/transport`, or `lib/jobs` under `lib/careos`.

Establish interfaces, ownership, contracts, events, authority, tests, and recovery first. Reorganise paths only when it materially improves maintainability.

## 5.6 Consolidation invariants

1. One participant-facing CareOS.
2. One canonical owner per concept.
3. No cross-domain database writes.
4. CareOS owns missions; domains own execution.
5. Shared concerns live in Core rather than being copied into each capability.
6. AI proposes; deterministic services execute.
7. Consequential actions carry explicit authority and purpose.
8. Capabilities expose evidence and recovery semantics.
9. Legacy routes disappear only after verified parity.
10. Consolidation must never weaken participant control, accessibility, privacy, auditability, or safety.

---

# 6. Intelligence Plane and agentic architecture

## 6.1 Reasoning fabric, not super-agent

CareOS should not have one unconstrained agent with direct access to every domain.

Use bounded reasoning capabilities such as:

- Intent Framer;
- Dependency Reasoner;
- Access Reasoner;
- Care Reasoner;
- Move Reasoner;
- Work Reasoner;
- Resource Reasoner;
- Recovery Planner;
- Evidence Interpreter;
- Communication Assistant.

An agent is an implementation technique, not a grant of authority.

## 6.2 Mission Reasoning Kernel

Input:

```text
participant intent
+
purpose-authorised Full Life context
+
Access requirements
+
current mission graph
+
domain capabilities
+
evidence
+
constraints
```

Output:

```text
MissionProposal
├── objective
├── assumptions[]
├── dependencies[]
├── unresolvedQuestions[]
├── options[]
├── rightsFlags[]
├── evidenceRefs[]
├── uncertainties[]
└── recommendedNextStep
```

A `MissionProposal` is not executable state.

## 6.3 Typed reasoning envelope

Consequential AI output should leave the model as typed structured data containing at minimum:

- proposal ID;
- mission ID;
- purpose;
- generation time;
- model/provider metadata;
- claims with evidence references and claim state;
- assumptions;
- unknowns;
- options;
- constitutional flags;
- required human reviews;
- prohibited actions.

## 6.4 Constitutional enforcement is outside the model

AI may reason about rights but is not trusted to enforce the Constitution alone.

Deterministic checks must block cases such as:

- prohibited social-worth scoring;
- unknown access being promoted to accessible;
- missing consent;
- insufficient delegate scope;
- AI attempting payment approval;
- prohibited clinical/funding/statutory automation.

Ambiguous rights questions route to accountable human review.

## 6.5 Intelligence never owns mission state

The target write path is:

```text
Intelligence
→ MissionProposal
→ Mission Command Service
→ CareOSMission
```

Do not allow model/agent components to write directly to Prisma `CareOSMission`.

Current direct mission-write paths should be converged behind the canonical mission service.

## 6.6 Model independence

Introduce a model gateway boundary so mission semantics and domain contracts are independent of one model vendor.

Model changes must not require changes to CareOS authority or mission ownership.

## 6.7 Minimum necessary context

Each reasoning call receives only the context required for its declared purpose.

CareOS must not send the participant's complete Full Life context when a narrower subset is sufficient.

## 6.8 Participant-owned memory vs AI memory

Canonical participant facts and preferences belong in explicit CareOS/Core stores when the person chooses to save them.

Model inference and conversational memory do not silently become participant facts.

Inference remains inference.

## 6.9 Recovery intelligence

Recovery is a high-value use of agentic reasoning because it can analyse many dependencies without seizing authority.

AI may generate recovery options; participant-relevant substitutions remain subject to rights, authority, consent, and confirmation.

## 6.10 Human review is first-class

Use explicit `HumanReviewRequest` objects rather than treating human intervention as failure.

A review request includes:

- mission;
- question;
- why review is required;
- evidence;
- AI analysis;
- uncertainty;
- participant preference;
- deadline where relevant;
- permitted reviewer role.

## 6.11 Advisory and governed-action modes

**Advisory mode:** AI explains, compares, drafts, and recommends. No external consequence.

**Governed action mode:** an approved proposal becomes a deterministic action token and then a domain service command. The model still does not execute the consequence itself.

## 6.12 AI-off parity

Every core participant journey must remain usable with AI disabled. The experience may be more manual, but the mission model, authority path, capability contracts, deterministic actions, evidence, and recovery must still work.

## 6.13 Evaluation hierarchy

Model quality is evaluated primarily on:

- rights compliance;
- authority boundaries;
- evidence grounding;
- uncertainty honesty;
- accessibility;
- privacy/minimum context;
- action safety;
- recovery behaviour;
- fairness/no social-worth ranking;
- AI-off parity.

## 6.14 Prompt injection boundary

External content from websites, providers, documents, messages, and partner APIs is untrusted data, never authority-bearing instruction.

## 6.15 Intelligence maxim

> **CareOS may think ahead of the participant; it may never decide above the participant.**

---

# 7. Rights, authority, consent, and safety Control Plane

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

Consent should be tied to:

- subject;
- recipient;
- purpose;
- information classes;
- mission/context;
- validity period;
- revocability;
- authority basis;
- disclosure/action receipt.

Broad generic consent must not be treated as permission for unrelated future purposes.

## 7.3 Supported decision-making is not delegation

```text
SUPPORT_FOR_DECISION
≠
AUTHORITY_TO_DECIDE
```

A supporter may help a person understand, communicate, use AAC, or express a choice without acquiring authority to decide.

## 7.4 Safety does not create blanket override authority

CareOS may surface safety information and trigger warning, pause, review, or escalation paths. It does not automatically acquire authority to override the participant.

Safety must preserve dignity of risk and use the least restrictive transparent safeguard compatible with lawful obligations.

## 7.5 Restricted autonomous decisions

Autonomous AI determination is prohibited for:

- NDIS eligibility;
- funding entitlement;
- payment approval;
- claim approval;
- legal capacity determination;
- restrictive-practice authorisation;
- abuse finding;
- statutory incident reportability;
- clinical diagnosis/treatment;
- provider/worker selection without required participant confirmation;
- sensitive employment disclosure.

## 7.6 Control Plane maxim

> **Authority follows the person, the purpose, and the decision—not the software component asking to act.**

---

# 8. Evidence Graph, events, continuity, and recovery

## 8.1 Evidence Graph

CareOS needs a shared evidence vocabulary without duplicating domain records.

A claim should be able to reference:

- subject;
- value;
- source;
- observed/reported time;
- verification method;
- confidence/evidence state;
- freshness/expiry;
- dispute state;
- evidence references.

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

Evidence may move to a stronger state only because stronger evidence was obtained, never merely because a model is confident.

## 8.2 Event Fabric

Important events include:

- care worker cancellation;
- trip confirmation/delay/cancellation;
- job interview change;
- venue access update;
- consent revocation;
- invoice dispute;
- participant preference change.

Events carry:

- event ID;
- type;
- occurrence time;
- actor;
- mission ID;
- domain object reference;
- correlation ID;
- causation ID;
- provenance;
- synthetic/test marker where relevant.

## 8.3 Distinct event records

Preserve the distinction:

```text
CareOSMissionEvent = participant mission history
CloudEventOutbox    = integration delivery
AuditEvent          = security / authority / data-access evidence
```

Do not combine them into one generic event table.

## 8.4 Dependency propagation

Domain events update affected mission dependency nodes and downstream risk state.

A failed dependency should not automatically invalidate the mission goal.

## 8.5 Recovery classes

Distinguish:

- automatic technical retry;
- participant-neutral operational recovery;
- participant-relevant substitution;
- safety escalation;
- no feasible recovery.

Participant-relevant substitutions require renewed choice/confirmation where material.

## 8.6 Causal attribution

CareOS records system causes of mission failure or disruption, such as:

- provider cancellation;
- vehicle failure;
- inaccessible entrance;
- market-capacity shortage;
- stale information;
- outage;
- scheduling conflict.

Do not create participant reliability, worth, or compliance scores from these events.

## 8.7 Recovery maxim

> **CareOS recovers the plan, not the person.**

---

# 9. Security, accessibility, operations, and governance

## 9.1 Security model

CareOS uses:

- least privilege;
- no implicit cross-domain trust;
- purpose-bound data access;
- tenant isolation;
- strong authentication;
- explicit participant authority;
- append-only audit/evidence where required;
- idempotent deterministic action tokens;
- replay protection;
- secure external-adapter boundaries.

Every sensitive internal request must answer:

- who is acting;
- for whom;
- for what purpose;
- under which authority;
- which information is needed;
- how long that authority/data use remains valid.

## 9.2 Required security tests

Critical paths must cover at least:

- cross-participant IDOR;
- cross-tenant access;
- delegate-scope bypass;
- stale-authority reuse;
- consent-revocation races;
- replayed action tokens;
- duplicate financial actions;
- forged webhooks;
- prompt injection;
- malicious-document instructions;
- event replay;
- mission multi-writer violations.

## 9.3 Accessibility is a release gate

Digital critical journeys require WCAG 2.2 AA **plus real assistive-technology acceptance testing**, not automated scanning alone.

Critical journeys should exercise:

- keyboard-only operation;
- screen readers;
- 200–400% zoom/reflow as appropriate;
- focus visibility/order;
- accessible names/semantics;
- status announcements;
- timeouts and extensions;
- error recovery;
- reduced motion;
- plain language;
- AAC-oriented interaction;
- alternative communication;
- accessible human fallback.

At least two meaningful assistive-technology/browser combinations should be used for release acceptance of critical journeys.

## 9.4 Observability

Observability exists at four levels:

```text
SYSTEM
DOMAIN
MISSION
PARTICIPANT IMPACT
```

Engineering telemetry should be able to detect not only service health but mission impact, subject to privacy and least-privilege constraints.

## 9.5 Graceful degradation

- AI unavailable → manual journey remains.
- Event delivery failure → durable replay.
- External provider API unavailable → unavailable/unknown state plus manual path.
- Accessibility evidence missing → unknown.
- Critical service interruption → defined continuity path appropriate to the service.

## 9.6 Governance classes

CareOS uses explicit governance depending on consequence:

- product;
- architecture;
- rights;
- security/privacy;
- accessibility;
- safety/safeguarding;
- model governance;
- operational governance;
- financial controls where relevant.

Review burden increases with potential consequence.

## 9.7 Constitutional amendment process

Full Life constitutional amendments require:

```text
proposed amendment
→ reason + evidence
→ rights-impact analysis
→ disabled-person / participant review
→ architecture implications
→ versioned approval
→ new constitutional version
```

Historical mission/evaluation evidence must retain which constitutional version applied.

---

# 10. Definition of Done, delivery gates, and programme sequence

## 10.1 Consequential capability Definition of Done

A consequential CareOS capability is production-complete only when it has:

```text
participant value demonstrated
+
canonical owner identified
+
authority path enforced
+
purpose / consent enforced
+
domain contract implemented
+
accessibility accepted
+
security tests passing
+
AI-off path working
+
evidence / provenance available
+
recovery path working
+
audit evidence
+
rollback path
+
public claims aligned to evidence
```

A capability lacking these may still be labelled prototype, in development, or implemented-but-unverified, but not production-complete.

## 10.2 Reference vertical slice

The first representative CareOS vertical slice should be:

> **Attend an appointment with personal support and accessible transport.**

This exercises:

- participant intent;
- access requirements;
- mission graph;
- Care;
- Move;
- timing dependencies;
- authority;
- consent;
- discovery;
- option comparison;
- participant selection;
- deterministic execution;
- events;
- failure;
- recovery;
- evidence;
- outcome review.

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

The current repository is not greenfield. It already contains broad CareOS/domain implementation with some conflicting documentation and multiple mission/intelligence paths.

The first implementation programme must therefore reconcile the following before feature expansion:

## 11.1 Mission single-writer boundary

Current `main` contains the canonical mission service but also direct mission writes from intelligence paths.

Target:

```text
UI / AI / domain
→ MissionCommand
→ CanonicalMissionService
→ CareOSMission
```

Direct AI/agent writes to `CareOSMission` are prohibited in the target architecture.

## 11.2 Documentation reconciliation

Some programme documents describe `CareOSMission` as absent or adapter-backed, while current main contains a canonical service and migration.

Current code and migrations take precedence. Stale programme documentation must be corrected or explicitly marked historical during convergence.

## 11.3 Intelligence-tree convergence

Current CareOS analysis identifies duplicate intelligence trees and prohibited-use/flag drift.

The implementation plan must converge them behind one CareOS Intelligence boundary without creating a third tree.

## 11.4 Evidence convergence

Access, transport, accreditation/Mark, workforce, and domain evidence should converge on common provenance semantics and a shared Evidence Graph API without copying every domain record into a new graph database prematurely.

## 11.5 Event reliability

The outbox/event relay must become durable enough to support mission recovery and status projection before broad live orchestration depends on it.

---

# 12. Non-goals and intentional non-features

CareOS does not pursue:

- automated NDIS eligibility;
- autonomous funding entitlement decisions;
- autonomous claim/payment approval;
- diagnosis or treatment decisions;
- restrictive-practice automation;
- AI capacity determinations;
- autonomous provider/worker selection where participant confirmation is required;
- participant risk, social-worth, productivity, deservingness, or life-value scoring;
- production physical assistive-technology actuation from CareOS;
- a second Core platform;
- a second RightsOS;
- a second Access Passport;
- a duplicate participant identity system;
- a universal single-table event store;
- a big-bang microservice rewrite;
- a big-bang database migration;
- a giant participant `FullLifeProfile` table;
- hidden single-score welfare optimisation.

Research may explore future possibilities, but these boundaries remain closed unless separately redesigned, governed, and explicitly approved.

---

# 13. Resource stewardship and option comparison

CareOS compares resources only among rights-compatible options.

The ordering is:

```text
Rights floor / compatibility
→ Essential sufficiency
→ Will and preferences
→ Barrier removal
→ Capability expansion
→ Distributional equity
→ Cost efficiency
```

For an individual participant mission, CareOS compares options for that same person's goal. It must not compare people by social worth.

A rights-compatible option may be represented by a multi-dimensional vector such as:

```text
[
  participant_preference,
  capability_gain,
  equity_effect,
  safety,
  reliability,
  accessibility,
  privacy_burden,
  admin_burden,
  direct_cost,
  whole_system_cost,
  sustainability
]
```

CareOS should surface dominance and trade-offs rather than hiding them behind one opaque score.

Aggregate policy simulation is separate from participant runtime, de-identified/appropriately governed, advisory, and prohibited from becoming a cross-person deservingness engine.

---

# 14. Evidence and claim-state discipline

During implementation and public communication, significant capability claims should use the project claim-state vocabulary:

- **Verified live** — directly observed in current production/deployment/authoritative evidence.
- **Implemented, not independently verified** — present in code/configuration but not proven live.
- **In development** — active work exists but is incomplete or gated.
- **Proposed** — approved/documented design with no implementation proof.
- **Exploratory** — concept requiring validation.
- **Historical** — older plan or snapshot that may no longer be current.

At this design date:

- this consolidated CareOS architecture is **Proposed**;
- the canonical `CareOSMission` service/migration are **Implemented, not independently verified in production**;
- broad cross-domain live orchestration is **not established as production-complete by this document**;
- Full Life constitutional architecture remains **Proposed/design-approved**, not proof of deployed enforcement;
- historical roadmaps and pitch material remain evidence of intent, not implementation status.

---

# 15. Implementation-plan decomposition

This blueprint is intentionally too broad for one implementation plan. It must be decomposed into independently testable sub-projects:

1. **CareOS Constitutional & Architecture Convergence**
   - canonical owners;
   - mission single-writer;
   - documentation reconciliation;
   - intelligence-tree convergence;
   - constitutional/architecture guardrails.

2. **CareOS Life Plane**
   - Today;
   - My Life projections;
   - Missions;
   - Discover;
   - Messages;
   - Money;
   - Support;
   - compatibility routes.

3. **Mission Fabric + Capability Contracts**
   - mission graph;
   - typed dependency model;
   - capability interfaces;
   - mission command boundary;
   - domain adapters.

4. **Rights, Authority & Consent Control Plane**
   - authority decisions;
   - purpose-bound consent;
   - delegate scope;
   - disclosure receipts;
   - human-review routing;
   - revocation propagation.

5. **Care + Move Reference Mission**
   - appointment goal;
   - Care dependency;
   - accessible trip dependency;
   - option comparison;
   - confirmation;
   - deterministic execution;
   - recovery;
   - outcome review.

6. **CareOS Intelligence + Constitutional Evaluations**
   - model gateway;
   - typed proposal envelopes;
   - bounded reasoners;
   - constitutional checks;
   - evaluation harness;
   - prompt-injection boundary;
   - AI-off parity.

7. **Evidence Graph + Recovery Fabric**
   - provenance model;
   - evidence-state vocabulary;
   - mission/domain events;
   - outbox reliability;
   - dependency propagation;
   - recovery classes;
   - causal attribution.

8. **Domain Consolidation & Legacy Retirement**
   - Work;
   - Home;
   - Supply;
   - Money;
   - Coordination;
   - Workforce/Trust;
   - redirects;
   - parity testing;
   - legacy route retirement.

Each sub-project receives its own specification or implementation plan as required by scope. Do not create one giant CareOS implementation branch.

---

# 16. Final architectural invariants

1. **The participant defines the destination. CareOS helps assemble and maintain the path.**
2. **CareOS carries coordination burden without taking away participant authority.**
3. **One life, one operating environment, many bounded capabilities.**
4. **The participant navigates their life; CareOS navigates the systems.**
5. **CareOS owns cross-programme mission state; domains own execution.**
6. **Shared Core capabilities are built once.**
7. **Models produce proposals, not authority.**
8. **Rights and authority checks exist outside the model.**
9. **No consequential cross-domain database writes.**
10. **Unknown remains unknown; inference remains inference.**
11. **Accessibility is a release criterion, not an enhancement.**
12. **Support for decision-making is not authority to decide.**
13. **Recovery fixes the path before questioning the person's destination.**
14. **Evidence includes provenance, recency, uncertainty, and contestability.**
15. **Efficiency may compare rights-compatible means; it may not decide whose rights matter.**
16. **Consolidation unifies participant experience without erasing accountable domain boundaries.**
17. **Every core journey remains possible without AI.**
18. **Public claims may not exceed deployed evidence.**

---

# 17. Design review checklist

Before implementation planning, reviewers should confirm:

- Full Life Constitution remains the normative parent layer;
- no parallel RightsOS, Core, mission store, identity store, or Access Passport is introduced;
- `CareOSMission` has one intended writer boundary;
- Life Plane navigation is participant-goal oriented rather than module oriented;
- domain ownership remains explicit;
- AI has no implicit consequential authority;
- consent/authority are purpose-bound and revocable;
- accessibility acceptance includes real assistive-technology testing;
- AI-off parity is preserved;
- evidence states preserve unknown/inference distinctions;
- recovery semantics distinguish technical retry from participant-relevant substitution;
- Support Coordination remains professional practice management, not ownership of participant life;
- Resource Stewardship avoids hidden social-worth or cross-person ranking;
- programme execution is decomposed into short-lived, independently testable sub-projects;
- stale repository documentation is reconciled before it is used as implementation truth.

---

## Closing statement

CareOS is not intended to automate a person's life. It is intended to make the systems around that life more coherent, accessible, explainable, reliable, and recoverable while preserving the person's authorship of their own decisions.

> **MapAble optimises systems around the person; it never optimises the person to fit the system.**
