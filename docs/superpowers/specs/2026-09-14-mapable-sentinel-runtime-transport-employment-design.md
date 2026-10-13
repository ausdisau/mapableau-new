# MapAble Sentinel Runtime + Transport + Employment — Design Specification

**Date:** 2026-09-14  
**Repository:** `ausdisau/mapableau-new`  
**Design status:** Approved architecture, implementation not started  
**Target claim state:** Proposed / implementation-ready design  
**Autonomy ceiling:** **B — Guardian Sentinel**  
**Production status:** Not production ready

## 1. Decision

Build **MapAble Sentinel** as an additive supervisory runtime beneath MapAble Care, Transport and Employment/Jobs. Sentinel may observe, verify, apply deterministic gates, pause unsafe or ambiguous consequential transitions, start durable recovery and human-review workflows, and prepare alternatives. It must not autonomously make consequential participant, safeguarding, funding, payment, clinical, legal, employment-selection, or emergency decisions.

The implementation shall preserve the existing MapAble authority chain:

> Models detect, classify, redact, explain and signal. MapAble Core policy decides whether a transition is permissible. Sentinel maintains durable supervisory state. Participants and authorised humans decide consequential choices. The Governed Action Kernel executes only approved actions through canonical domain services.

## 2. Evidence and current-state anchors

This design is grounded in the repository state on `main` at commit `ae8cb19cc4a1b046852dfae5ae89f5f8f57eb65a`.

### Existing components to reuse

- `lib/ai/platform/guardian/` — deterministic privacy, purpose, processing and safeguarding policy control plane.
- `lib/ai/platform/actions/` — Governed Action Kernel and approval-bound execution boundary.
- `lib/consent/`, `lib/authority/`, `lib/audit/` — canonical consent, authority and audit services.
- `lib/incidents/` and complaint services — canonical incident and complaint systems of record.
- `lib/care/` and workforce readiness services — care and worker eligibility/readiness.
- `lib/transport/` — transport lifecycle, assignment, verification, routing, evidence and service-recovery capabilities.
- `lib/jobs/` — participant employment profiles, goals, disclosure previews, matching explanations and employer accessibility evidence.
- CareOS mission graph and Continuity Radar — dependency and recovery context; Sentinel does not replace them.

### Existing policy boundaries that remain binding

- Guardian is not a conversational agent, statutory decision-maker, complaint adjudicator, incident-reportability assessor, capacity assessor or restrictive-practice decision-maker.
- Action Kernel is the execution boundary.
- CareOS agents interpret, retrieve, compare, draft and recommend; participants decide; existing MapAble services execute.
- Jobs hard boundaries prohibit employability scoring, automatic rejection, disability inference and productivity ranking.
- Transport preserves truthful distinctions such as requested vs booked vs assigned and advisory ETA vs confirmed pickup.

## 3. Scope

### In scope for v1

1. Shared Sentinel contracts and authority state machine.
2. Event ingestion from canonical MapAble domain events/outbox.
3. Deterministic Guardian policy integration.
4. Durable Temporal orchestration for cases requiring waiting, retries, timers, recovery or human/participant input.
5. Sentinel Case read model containing orchestration references and policy state, not duplicated domain data.
6. Participant and human-review interaction contracts.
7. Transport Sentinel vertical slice.
8. Employment Sentinel vertical slice.
9. Cross-domain dependency propagation for Care ↔ Transport ↔ Employment missions.
10. Audit, observability, feature flags, kill switches and rollback.
11. Synthetic/security assurance integration boundary for the external AGPL Sentinel security-testing project.

### Explicitly out of scope for v1

- Automatic worker assignment.
- Automatic transport confirmation or replacement selection.
- Automatic employer rejection or employability scoring.
- Automatic disability or health disclosure to employers.
- Incident reportability or abuse substantiation decisions.
- Restrictive-practice authorisation.
- Funding-plan, claim, invoice or payment approval.
- Clinical decisions or medical triage.
- Calling emergency services.
- Physical device actuation.
- Replacing CareOS, ContinuityOS, Guardian, Action Kernel or any canonical system of record.
- Production enablement before privacy, security, operations and data-residency assurance are complete.

## 4. Architectural principles

### 4.1 Single Sentinel, domain profiles

There shall be one Sentinel supervisory architecture with domain-specific profiles for Care, Transport and Employment. Do not build independent autonomous agents with separate authority rules.

### 4.2 Canonical ownership remains outside Sentinel

Sentinel owns only:

- supervisory case lifecycle;
- policy-evaluation references;
- pause/review/recovery state;
- Temporal orchestration identifiers;
- safe summaries needed to explain current supervisory status.

Sentinel does **not** own participant profiles, consent receipts, bookings, trips, workers, vehicles, job applications, employer records, incidents, complaints, funding data or invoices.

### 4.3 Unknown remains unknown

A missing or stale access, credential, suitability or disclosure fact must not be converted into a positive assertion. Deterministic policy decides whether an unknown state permits continuation, requires verification, or requires a pause.

### 4.4 Pause is narrow and least restrictive

A Sentinel pause is permitted only for a consequential transition covered by an explicit policy rule. Read-only browsing and non-consequential drafting should not be globally blocked because an unrelated Sentinel case exists.

### 4.5 AI is outside the trust boundary

Model output may create a signal or explanation. It may not directly transition a case to an executing action, create authority, grant consent, resolve safeguarding, or alter canonical business state.

## 5. Logical architecture

```text
MapAble UI / Domain APIs
        │
        ▼
Canonical domain services + outbox/events
        │
        ▼
Sentinel Event Gateway
        │
        ├── Identity / tenant context
        ├── Authority references
        ├── Purpose / consent references
        └── Data classification references
        │
        ▼
Existing Unified Guardian policy kernel
        │
        ├── allow
        ├── allow with conditions
        ├── participant confirmation
        ├── human review
        ├── complaint / incident handoff
        ├── deny
        └── security quarantine
        │
        ▼
Sentinel Case Engine
        │
        ├── immediate release when no durable supervision is needed
        └── Temporal workflow when waiting/recovery/retry is needed
                  │
                  ├── ContinuityOS / recovery proposal activities
                  ├── participant Signal/Update
                  ├── authorised human Signal/Update
                  └── verification activities
                  │
                  ▼
        Approved action proposal
                  │
                  ▼
        Governed Action Kernel
                  │
                  ▼
        Canonical domain service
                  │
                  ▼
        Audit + postcondition verification
```

## 6. Sentinel event contract

Create a versioned, minimal event envelope. The event is a supervisory trigger, not a replacement domain record.

Required fields:

| Field | Meaning |
|---|---|
| `eventId` | Globally unique idempotency identifier |
| `schemaVersion` | Contract version |
| `domain` | `care`, `transport`, `employment`, or approved shared domain |
| `eventType` | Typed domain event name |
| `tenantId` | Organisation/tenant isolation boundary |
| `subjectRef` | Canonical domain object reference |
| `participantRef` | Pseudonymous participant reference where applicable |
| `actorRef` | Actor/system producing the event |
| `purpose` | Processing purpose identifier |
| `authorityRef` | Reference to current authority decision/relationship |
| `consentRefs` | Applicable consent receipt references |
| `dataClasses` | Canonical data classifications relevant to processing |
| `evidenceRefs` | References to canonical evidence records |
| `payloadRef` | Optional pointer to data outside Temporal history |
| `occurredAt` | UTC domain-event timestamp |
| `source` | Canonical producer identifier |

### Event contract invariants

- Do not include diagnosis, free-text health details, exact address, safeguarding narrative or employment-disclosure content in the envelope unless an explicit approved policy says it is necessary.
- Prefer references over copies.
- Duplicate `eventId` must not produce duplicate domain side effects.
- Events must be immutable once emitted; corrections are new events.
- Consumers must tolerate newer optional fields and reject incompatible major versions.

## 7. Sentinel case model

A `SentinelCase` is created only when durable supervision is necessary. Harmless reads and ordinary successful transitions should not create cases.

Recommended fields:

```text
caseId
caseType
missionRef?
domain
subjectRefs[]
participantRef?
tenantId
state
reasonCodes[]
policyVersion
openedAt
updatedAt
resolvedAt?
temporalWorkflowId?
requiredAuthorityLevel
participantDecisionRequired
humanReviewRequired
recoveryRequired
activeEvidenceRefs[]
unknownEvidenceRefs[]
proposedRecoveryRefs[]
lastAuditEventRef
```

Sensitive business payloads remain in canonical stores and are retrieved through Activities using least-privilege service interfaces.

## 8. Authority state machine

Canonical supervisory states:

- `OBSERVING`
- `VERIFICATION_REQUIRED`
- `PAUSED`
- `PARTICIPANT_CONFIRMATION_REQUIRED`
- `HUMAN_REVIEW_REQUIRED`
- `COMPLAINT_HANDOFF`
- `INCIDENT_TRIAGE_HANDOFF`
- `RECOVERY_PROPOSED`
- `APPROVED_ACTION_PENDING`
- `CONTINUING`
- `RESOLVED`
- `STOPPED_BY_PARTICIPANT`
- `SECURITY_QUARANTINE`
- `DEGRADED`
- `FAILED_SAFE`

### Transition rules

1. Only deterministic policy or verified domain facts may move a case into a blocking state.
2. Model signals can request evaluation but cannot directly authorise, execute or resolve.
3. `PARTICIPANT_CONFIRMATION_REQUIRED` requires an explicit participant decision except where a lawful authorised representative has authority for the exact decision.
4. `HUMAN_REVIEW_REQUIRED` records the required role and policy reason; it does not infer that any available staff member has authority.
5. `APPROVED_ACTION_PENDING` means the decision is approved but not yet executed.
6. The Governed Action Kernel remains responsible for execution validation, payload binding, replay protection and domain-service invocation.
7. A failed execution returns the case to a recoverable state or `FAILED_SAFE`; it must not be marked resolved because approval existed.
8. Participant stop/withdrawal is respected immediately for future optional processing, subject only to already-completed legal/audit records and narrowly defined safety/legal retention obligations.

## 9. Temporal design

### 9.1 Runtime boundary

Temporal is used for durable coordination across process restarts, timeouts, human waits, participant waits, retries and recovery. It is not the business system of record.

The Next.js/Vercel application remains the web/API layer. Temporal Workers must run in a long-lived worker environment separate from request-lifecycle hosting.

### 9.2 Workflow topology

#### `SentinelCaseWorkflow`

Shared workflow for generic review/recovery cases.

Responsibilities:

- maintain supervisory state;
- wait for participant/human decisions;
- start child workflows where domain-specific recovery is required;
- query current state and reason codes;
- enforce workflow-level timers;
- continue-as-new for genuinely long-running cases.

#### `TransportSentinelWorkflow`

One workflow per confirmed `TransportTrip` when Sentinel supervision is enabled for that trip.

Responsibilities:

- supervise assignment readiness, prestart, disruption, no-show and recovery;
- receive transport domain signals;
- start `ContinuityRecoveryWorkflow` when fulfilment breaks;
- wait for participant/operator-authorised decisions;
- request Action Kernel proposals rather than writing Transport state directly.

#### `EmploymentParticipationSentinelWorkflow`

One workflow per employment application/participation episode when enabled.

Responsibilities:

- enforce stage-based disclosure boundaries;
- supervise adjustment and interview-access dependencies;
- track stale/unknown workplace-access evidence;
- receive transport/care dependency alerts without disclosing disability information;
- wait for participant-controlled disclosure/adjustment decisions.

#### Child workflows

- `ContinuityRecoveryWorkflow`
- `HumanReviewWorkflow`
- `SafeguardingHandoffWorkflow`
- `CredentialRecheckWorkflow` when a durable re-verification period is required

### 9.3 Signals

Participant-facing Signals/Updates:

- `pause`
- `resume`
- `stop`
- `confirmAlternative`
- `rejectAlternative`
- `requestHuman`
- `correctRequirement`
- `withdrawConsentScope`

Domain/system signals:

- `domainStateChanged`
- `credentialStateChanged`
- `evidenceStateChanged`
- `consentAuthorityChanged`
- `killSwitchChanged`
- `recoveryOptionsChanged`

### 9.4 Queries

Read-only Queries:

- current Sentinel state;
- reason for pause;
- evidence requirements;
- next permitted action;
- current recovery alternatives;
- whether participant/human input is required;
- current domain dependency status.

Queries must never mutate workflow state.

### 9.5 Activities

All network, database and side-effecting work occurs in Activities or canonical services, including:

- fetch authority/consent;
- fetch current Care/Transport/Jobs state;
- evaluate worker/driver/vehicle readiness using canonical services;
- call Guardian policy evaluation;
- fetch continuity candidates;
- prepare recovery alternatives;
- create human-review work item;
- create complaint/incident handoff reference in canonical service;
- write audit event;
- prepare Action Kernel proposal;
- read Action Kernel execution result;
- verify postconditions.

Activities must be idempotent or use idempotency keys.

### 9.6 Temporal data privacy

- Use pseudonymous identifiers in workflow ids and Search Attributes.
- Never place diagnosis, exact location, free-text safeguarding detail, employer disclosure content or payment data in Search Attributes or memo.
- Prefer `payloadRef` and canonical data retrieval.
- If large/sensitive payloads must enter Temporal, use an encrypted payload codec and external storage only after security review. Temporal TypeScript external-storage support is currently treated as an optional capability, not a v1 requirement.
- Set retention/lifecycle policies deliberately; do not rely on indefinite workflow history as a participant record store.

### 9.7 Workflow change safety

Long-running workflows require replay-safe evolution. Use Temporal workflow patching/versioning or new workflow types for incompatible changes, with replay tests before deployment.

## 10. Participant experience

Add a reusable accessible Sentinel status component for supported journeys.

Participant-facing language must explain:

- what MapAble observed;
- what is fact, possibility or unknown;
- why a transition is paused when applicable;
- what information is missing;
- what choices are available;
- whether a human is involved;
- what happens if the participant does nothing.

Primary controls:

- Continue, when policy permits.
- Change requirement/details.
- Stop.
- Ask a person.
- Review alternatives.
- Confirm/reject an alternative.

Accessibility requirements:

- WCAG 2.2 AA minimum.
- Semantic HTML and predictable focus.
- Full keyboard and screen-reader operation.
- AAC-compatible text interaction.
- Large touch targets.
- Reflow and zoom support.
- No countdown or auto-dismiss pressure for consequential consent/choice.
- Plain-language and Easy Read-compatible summaries.
- Status updates announced accessibly without stealing focus.
- Map-based information must have a non-map equivalent.

## 11. Human-review experience

Human review queues are organised by required role/authority and policy reason, not opaque AI severity scores.

Each review item shows:

- participant's stated preference;
- exact consequential transition under review;
- deterministic reason codes;
- facts vs unknowns vs model-generated signals;
- evidence provenance/freshness;
- consent/authority context;
- deadline or operational timing;
- available least-restrictive alternatives;
- complaint/incident handoff links where applicable.

Review actions must call canonical approval/domain services. UI buttons must not bypass the Governed Action Kernel.

## 12. Transport Sentinel design

### 12.1 Purpose

Prevent a confirmed transport journey from silently moving from planned to unsafe, incompatible, unavailable or falsely represented while preserving participant control over recovery.

### 12.2 Watched events

Initial registry:

- `transport.request.created`
- `transport.quote.created`
- `transport.quote.expiring`
- `transport.quote.accepted`
- `transport.assignment.proposed`
- `transport.assignment.confirmed`
- `transport.driver_credential.changed`
- `transport.vehicle_verification.changed`
- `transport.vehicle_compatibility.changed`
- `transport.prestart.completed`
- `transport.prestart.failed`
- `transport.driver.no_show`
- `transport.vehicle.unavailable`
- `transport.delay.material`
- `transport.route.disrupted`
- `transport.location_signal.stale`
- `transport.trip.started`
- `transport.trip.completed`
- `transport.evidence.submitted`
- `transport.participant.disputed`
- `transport.incident.created`
- `transport.consent.withdrawn`

### 12.3 Consequential gates

Sentinel may pause:

1. **Assignment activation** when a required driver credential is invalid/expired, required vehicle fit is known incompatible, a mandatory access requirement is unresolved, or required authority/consent is missing.
2. **Departure** when a deterministic required prestart check fails.
3. **Sensitive location disclosure** when role, purpose, lifecycle stage or consent does not permit exact-location access.
4. **Recovery activation** when a proposed replacement has unknown or incompatible hard access requirements.

Sentinel must not automatically select or assign a replacement driver/vehicle.

### 12.4 Transport recovery invariant

Recovery must preserve all hard participant requirements. A shortage of supply cannot silently weaken accessibility, communication or safety requirements.

Example:

```text
Powered-wheelchair transport required
+ replacement vehicle hoist compatibility = UNKNOWN
=> replacement is not confirmed compatible
=> verification/manual review required
```

### 12.5 First Transport vertical slice

Implement and test only:

1. invalid/expired driver credential before assignment activation;
2. vehicle access incompatibility/unknown evidence before assignment activation;
3. driver or vehicle no-show/unavailability before pickup.

Expected sequence:

```text
detect -> deterministic evaluate -> pause if required -> preserve requirements
-> ContinuityOS recovery proposals -> participant/authorised human decision
-> Action Kernel proposal -> canonical Transport execution -> postcondition check
```

## 13. Employment Sentinel design

### 13.1 Purpose

Protect candidate control over disclosure, accessibility and adjustments while coordinating practical dependencies such as workplace access, interview arrangements and transport. Sentinel must never determine whether a disabled person is employable.

### 13.2 Watched events

Initial registry:

- `employment.profile.updated`
- `employment.goal.updated`
- `employment.match_explanation.generated`
- `employment.application.drafted`
- `employment.disclosure.previewed`
- `employment.disclosure.confirmed`
- `employment.application.submitted`
- `employment.application.withdrawn`
- `employment.adjustment_request.created`
- `employment.adjustment_request.updated`
- `employment.interview.scheduled`
- `employment.interview.location_changed`
- `employment.workplace_access_evidence.updated`
- `employment.workplace_access_evidence.stale`
- `employment.workplace_access_evidence.disputed`
- `employment.transport_plan.created`
- `employment.support_plan.created`
- `employment.employer_disclosure.requested`
- `employment.employer_data_accessed`
- `employment.offer.received`
- `employment.placement.started`
- `employment.retention_checkpoint.requested`
- `employment.retention_checkpoint.completed`
- `employment.discrimination_concern.created`
- `employment.consent.withdrawn`

### 13.3 Disclosure contract

Disclosure permission is scoped to:

```text
participant + employer + application + application stage + fields + purpose + expiry
```

Consent to share one adjustment at interview stage must not silently authorise unrelated disability, health, NDIS, Care or Transport data for later employer stages.

### 13.4 Prohibited employment outputs

Sentinel/AI must block or quarantine attempts to create or operationalise:

- employability scores;
- disability-derived productivity ranking;
- predicted support-cost desirability;
- predicted complaint risk;
- disability inference from behaviour or records;
- automatic applicant rejection;
- automatic employer disclosure.

These remain prohibited even if a model or external integration requests them.

### 13.5 Workplace accessibility evidence

Accessibility evidence has provenance and freshness. Stale or missing evidence remains stale/unknown. Sentinel may request verification or offer a participant-controlled adjustment path; it must not upgrade evidence to verified because a model predicts accessibility.

### 13.6 First Employment vertical slice

Implement and test only:

1. application disclosure preview and participant confirmation;
2. interview adjustment request with scoped disclosure;
3. commute dependency alert without disability disclosure to employer.

Expected sequence:

```text
application/interview event -> disclosure/evidence policy -> participant choice
-> approved Action Kernel proposal where an external/domain write is required
-> employer-visible payload limited to approved fields -> audit
```

## 14. Cross-domain mission supervision

Sentinel may correlate references across Care, Transport and Employment only when a mission or participant-authorised workflow establishes that dependency.

Example mission:

```text
Goal: attend employment interview
  -> interview event
  -> accessible venue requirement
  -> TransportTrip dependency
  -> optional Care/support dependency
```

If Transport fails shortly before an interview:

1. Transport Sentinel records fulfilment disruption.
2. ContinuityOS searches compliant alternatives.
3. Hard access requirements remain unchanged.
4. Employment Sentinel receives only the dependency status needed to protect the interview mission.
5. Participant may choose another accessible transport option, self-arranged transport, interview reschedule, remote interview or human coordination.
6. No disability explanation is sent to the employer unless the participant explicitly approves the relevant disclosure.

Cross-domain propagation must use status/reason references rather than copying sensitive source records.

## 15. Guardian integration

Do not destructively rename `lib/ai/platform/guardian/` in v1.

Add a Sentinel policy adapter that reuses Guardian contracts and reason codes. Existing Guardian flags remain authoritative for Guardian inference/processing behaviour.

Sentinel-specific flags may add orchestration capability but must not duplicate Guardian semantics.

Recommended flags, all default `false`:

```text
MAPABLE_SENTINEL_ENABLED
MAPABLE_SENTINEL_TEMPORAL_ENABLED
MAPABLE_SENTINEL_CARE_GATING_ENABLED
MAPABLE_SENTINEL_TRANSPORT_GATING_ENABLED
MAPABLE_SENTINEL_EMPLOYMENT_GATING_ENABLED
MAPABLE_SENTINEL_CONTINUITY_ENABLED
MAPABLE_SENTINEL_MODEL_SIGNALS_ENABLED
MAPABLE_SENTINEL_KILL_SWITCH
```

`MAPABLE_SENTINEL_MODEL_SIGNALS_ENABLED` must not imply Guardian external processing is permitted; existing Guardian routing/privacy flags still govern that decision.

## 16. Kill switch and degraded mode

### Kill switch behaviour

When `MAPABLE_SENTINEL_KILL_SWITCH=true`:

- stop starting new Sentinel workflows;
- prevent Sentinel from introducing new automated pauses;
- preserve already-recorded policy/audit evidence;
- route participants/operators to canonical manual domain paths;
- keep complaints, incidents and human support available;
- do not auto-execute pending approved actions merely because Sentinel is disabled.

### Temporal unavailable

If Temporal is unavailable:

- immediate deterministic Guardian checks may continue where safe;
- new durable recovery/review flows fail closed for transitions that require durable supervision;
- manual domain recovery remains available;
- user-facing copy states that automated coordination is unavailable, not that the underlying service is necessarily unavailable.

### Model unavailable

Model outage must not disable deterministic policy, canonical domain operations, participant controls or human review. Model-assisted explanations/signals degrade to deterministic/human alternatives.

## 17. Audit and observability

Required audit events include:

- case opened/resolved;
- policy decision and version;
- pause reason;
- participant confirmation/rejection/stop;
- human review decision and authority role;
- recovery option generated/selected/rejected;
- Action Kernel proposal/approval/result references;
- consent/authority change affecting a case;
- security quarantine;
- kill-switch and degraded-mode activation.

Operational metrics should measure system behaviour, not score participants:

- cases opened by reason code;
- false-positive/over-pause rate;
- time to participant-visible explanation;
- time to human review;
- time to restored service;
- recovery success rate;
- percentage of cases resolved without weakening requirements;
- consent/disclosure correction rate;
- cross-tenant/security failures;
- accessibility defects;
- model-signal disagreement with deterministic/human review.

Do not create participant "risk scores" as an observability shortcut.

## 18. Security and privacy

- Tenant isolation is server-enforced on every event, query and Activity.
- Connector credentials never enter model context or Temporal workflow state.
- External writes use Action Kernel → Connector Gateway → scoped adapter.
- Sensitive data access uses minimum necessary fields and is auditable.
- Prompt-injected domain content is treated as untrusted content, never as policy or tool instructions.
- Exact transport location is purpose- and lifecycle-gated.
- Employer access remains tenant-scoped and disclosure-scoped.
- Sentinel cases must not create a shadow disability profile.
- Participant correction and challenge paths must exist for inferred/model-generated signals.

## 19. Sentinel Assurance Lab boundary

The external `NenXMaster-AB/sentinel` project is an AI security and quality-testing suite and is licensed AGPL-3.0. It must not be vendored into MapAble runtime code in v1 without a separate licence review.

Recommended role: **Sentinel Assurance Lab**, a separate testing environment with no live operational authority.

Inputs should default to:

- synthetic participants;
- synthetic Care/Transport/Employment scenarios;
- de-identified/redacted event fixtures;
- prompts/tool schemas/policy bundles;
- generated attack fixtures;
- sanitized decision traces.

Assurance tests include:

- prompt injection;
- hallucinated credentials/evidence;
- data leakage;
- cross-tenant attacks;
- tool abuse;
- policy bypass;
- employer disclosure attacks;
- unsafe transport recovery suggestions;
- adversarial attempts to convert unknown evidence into verified facts.

Assurance findings may gate a release or feature flag. They do not decide live participant cases.

## 20. Proposed repository layout

```text
lib/ai/platform/sentinel/
  contracts/
  events/
  authority/
  policy-adapter/
  cases/
  transport/
  employment/
  audit/
  index.ts

apps/sentinel-worker/
  temporal/
    workflows/
      sentinel-case.workflow.ts
      transport-sentinel.workflow.ts
      employment-sentinel.workflow.ts
      continuity-recovery.workflow.ts
      human-review.workflow.ts
    activities/
    signals/
    queries/
    worker.ts

components/sentinel/
  SentinelStatus.tsx
  SentinelDecisionPanel.tsx
  SentinelEvidenceSummary.tsx

app/api/sentinel/
  cases/
  participant-actions/
  human-review/

tests/sentinel/
  core/
  transport/
  employment/
  cross-domain/
  privacy/
  security/
  accessibility/
  replay/

docs/sentinel/
  authority-model.md
  event-contracts.md
  temporal-runtime.md
  transport.md
  employment.md
  assurance-lab.md
```

The implementation plan may adjust exact filenames to existing repository conventions, but it must preserve these responsibility boundaries.

## 21. Test strategy

### Unit/contract tests

- event schema validation and version handling;
- policy adapter mapping;
- state-machine transition validity;
- disclosure-scope calculations;
- no weakening of hard Transport requirements;
- no prohibited Jobs scoring/output;
- feature flag and kill-switch behaviour.

### Temporal tests

Use Temporal test facilities with mocked Activities for:

- participant Signals/Updates;
- human review waits;
- timers and expiry;
- duplicate event delivery;
- Activity retries;
- worker restart/replay;
- Continue-as-New where used;
- workflow version/patch compatibility.

### Integration tests

- Guardian → Sentinel → Action Kernel proposal chain;
- Transport credential failure vertical slice;
- Transport no-show recovery vertical slice;
- Employment disclosure vertical slice;
- Employment commute dependency vertical slice;
- cross-domain interview mission;
- tenant-isolation negative tests;
- consent withdrawal during an active workflow.

### Accessibility tests

- automated WCAG checks;
- keyboard-only journey;
- NVDA/VoiceOver manual checks;
- AAC-compatible text journey;
- 200–400% zoom/reflow;
- focus management for live state changes;
- no timed consent pressure.

### Security/eval tests

- malicious provider/employer text attempting tool or policy injection;
- fabricated verification evidence;
- cross-tenant identifier substitution;
- replay of an approval/action;
- stale consent reference;
- poisoned recovery option;
- model unavailable;
- Temporal unavailable;
- kill switch activated mid-case.

## 22. Rollout sequence

### Wave 0 — contracts only

Add Sentinel contracts, event registry, state machine, reason codes, config and tests. No domain gating.

### Wave 1 — Temporal synthetic runtime

Add worker, workflows, Activities and test environment. Synthetic fixtures only. No production participant events.

### Wave 2 — Transport shadow mode

Feed selected Transport events into Sentinel. Record what would have paused/recovered. Do not block live domain transitions.

### Wave 3 — Transport controlled pilot

Enable only the three approved Transport vertical-slice gates for a limited cohort after security/privacy/accessibility review and rollback rehearsal.

### Wave 4 — Employment shadow mode

Enable disclosure/interview/commute supervision without blocking production employer workflows.

### Wave 5 — Employment controlled pilot

Enable the approved disclosure and adjustment gates with participant-controlled scope.

### Wave 6 — Cross-domain interview mission

Pilot a participant-authorised mission spanning Employment + Transport and optional Care. Validate that failures propagate as dependency status without unauthorised disclosure.

### Wave 7 — Assurance Lab release gate

Run synthetic red-team/security suites against prompts, tools, policies and fixtures. Do not use it as a live runtime dependency.

## 23. Release maturity model

Track each capability independently:

```text
CONCEPT
SCAFFOLD
SYNTHETIC_DEMO
SHADOW
INTERNAL_ALPHA
CONTROLLED_PILOT
LIMITED_RELEASE
PRODUCTION_READY
```

Do not claim "Sentinel production ready" because one domain slice has advanced. Public and internal status language must identify the exact capability and maturity stage.

## 24. Acceptance criteria for v1 implementation

Sentinel v1 is implementation-complete only when:

1. Existing Guardian remains the deterministic policy authority.
2. Existing Action Kernel remains the execution boundary.
3. Canonical Care/Transport/Jobs systems remain systems of record.
4. Sentinel event contracts are typed, versioned and idempotent.
5. Temporal workflows contain orchestration state/references rather than shadow participant records.
6. Participant stop, correction and human-help paths work.
7. Transport vertical slice passes credential, vehicle-fit and no-show scenarios.
8. Employment vertical slice passes disclosure, adjustment and commute-dependency scenarios.
9. Consent withdrawal during an active workflow halts future scoped processing.
10. Cross-tenant negative tests pass.
11. Model outage leaves deterministic/manual paths usable.
12. Temporal outage has a tested fail-safe/manual recovery path.
13. Kill switch is tested before pilot enablement.
14. Replay/version tests pass for long-running workflows.
15. Manual accessibility testing is completed for participant and reviewer surfaces.
16. No production flag defaults to enabled.
17. No evidence supports a production, compliance, certification or NDIS-registration claim solely from implementation.

## 25. Infrastructure decision boundary

The application architecture must not hard-code a specific Temporal hosting provider. Development may use a local Temporal environment. Production enablement requires a separately documented decision covering:

- Australian privacy/data-handling requirements;
- region/data residency and cross-border disclosure;
- encryption and key management;
- backup/restore and disaster recovery;
- worker runtime hosting;
- network isolation;
- monitoring/on-call ownership;
- retention;
- cost;
- incident response;
- vendor/legal review.

Until that decision is approved, Temporal-backed Sentinel remains synthetic/shadow only.

## 26. NaCl architecture handoff

NaCl SA graph persistence is not performed by this spec because the required project-local `nacl_neo4j` tooling is not available in this conversation.

Graph-ready module candidates:

- `sentinel-runtime`
- `sentinel-temporal-orchestration`
- `sentinel-transport-profile`
- `sentinel-employment-profile`
- `sentinel-assurance-lab-adapter`

Dependency direction:

```text
sentinel-transport-profile -> sentinel-runtime
sentinel-employment-profile -> sentinel-runtime
sentinel-runtime -> guardian-policy
sentinel-runtime -> governed-action-kernel
sentinel-runtime -> continuity-services
sentinel-temporal-orchestration -> sentinel-runtime contracts
sentinel-assurance-lab-adapter -> synthetic/redacted Sentinel artifacts only
```

**NaCl verification status:** `BLOCKED` — project MCP/graph tooling unavailable. No graph-write claim is made.

## 27. Implementation guardrails

The implementation plan must:

- use test-driven development for each implementation task;
- preserve current Guardian/Action Kernel boundaries;
- avoid broad refactors unrelated to Sentinel;
- introduce flags disabled by default;
- add synthetic fixtures before live integration;
- verify exact existing repository paths before editing;
- separate failures introduced by Sentinel from pre-existing failures;
- require independent review before controlled-pilot flags are enabled;
- never merge automatically as part of this design phase.

## 28. Final architecture summary

```text
Full Life / Mission layer
          │
          ▼
     MapAble Sentinel
 durable supervisory layer
          │
   ┌──────┼─────────┐
   ▼      ▼         ▼
 Care  Transport  Employment
   │      │         │
   └──────┼─────────┘
          ▼
     ContinuityOS
 recovery proposals
          │
          ▼
participant / authorised human
          │
          ▼
 Governed Action Kernel
          │
          ▼
 canonical domain services
          │
          ▼
 audit / postcondition evidence
```

Sentinel is valuable not because it becomes an all-powerful agent, but because it maintains the integrity of participant intent, consent, accessibility requirements and service dependencies across time while failures and changes occur.
