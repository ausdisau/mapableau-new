# Care & Support Sentinel — Consent and Dignity Architecture

**Date:** 16 September 2026  
**Status:** Design proposal approved in principle; implementation not yet started  
**Repository:** `ausdisau/mapableau-new`  
**Primary owner:** MapAble Core / CareOS governance  
**First delivery target:** bounded Care workflow integration behind feature flags

## 1. Decision

Implement the Care & Support Sentinel as a **participant-centred, consent- and dignity-based assurance layer** inside the existing MapAble Unified Care & Support Guardian. It must observe **service commitments, permissions, system state and participant-selected conditions — not the person**.

The Sentinel is **not** a new operational agent, not a surveillance system, not a clinical monitor, and not a replacement for human safeguarding, incident, complaint, consent or service-delivery responsibilities.

## 2. Constitutional rule

> **The Sentinel watches commitments, permissions, systems and explicitly selected conditions — not people.**

If a proposed feature requires ambient surveillance, covert behavioural inference, continuous emotional monitoring, general location tracking, indiscriminate recording, or persistent risk scoring, it is outside this architecture and must not be implemented under the Care & Support Sentinel name.

## 3. Strategic purpose

The Sentinel exists to make participant rights, service reliability and organisational accountability operational.

It should help MapAble:

1. preserve participant choice and control;
2. ensure consent remains purpose-bound, visible and revocable;
3. detect concrete service failures before they silently cascade;
4. surface stale or missing evidence instead of inventing confidence;
5. make accessible human escalation available without forcing it;
6. provide auditable evidence that agreed controls operated;
7. support dignity of risk rather than paternalistic risk elimination;
8. hold MapAble and service actors accountable to agreed commitments.

## 4. Relationship to current MapAble architecture

The current architecture already contains:

- participant authority controls;
- purpose and consent gates;
- the Unified Care & Support Guardian under `lib/ai/platform/guardian/`;
- a safeguarding gate under `lib/ai/platform/policies/safeguarding-gate.ts`;
- human-review infrastructure;
- authority ceilings;
- kill switches;
- governed action envelopes;
- the Governed Action Kernel;
- continuity-assurance and support-participation agents;
- incident and complaint systems of record.

The Sentinel must **reuse** these controls. It must not create:

- a second consent ledger;
- a second incident system;
- a second complaint system;
- a second authority taxonomy;
- a second action kernel;
- a second model registry;
- a ninth operational agent;
- a generalised participant risk profile.

## 5. Architectural placement

```text
Participant / authorised supporter
            │
            ▼
Identity / tenant / authority
            │
            ▼
Purpose + consent gate
            │
            ▼
Unified Care & Support Guardian
            │
            ├── privacy processing decision
            ├── safeguarding gate
            ├── Care & Support Sentinel
            │      ├── rights checks
            │      ├── continuity checks
            │      ├── participant-selected watches
            │      └── quality/accountability signals
            │
            ▼
Structured SentinelDecision
            │
            ├── INFORM
            ├── REQUEST_CONFIRMATION
            ├── OFFER_ALTERNATIVES
            ├── ROUTE_HUMAN_REVIEW
            ├── BLOCK_UNAUTHORISED_PROCESSING
            └── NO_ACTION
            │
            ▼
Governed Action Kernel
            │
            ▼
Deterministic domain service / audit
```

The Sentinel sits **before consequential action execution** and may constrain or route proposals. It does not execute bookings, assignments, payments, disclosures or statutory actions itself.

## 6. Observation model

### 6.1 Permitted event classes

The Sentinel may process only purpose-bound events already created by MapAble or explicitly enabled by the participant.

#### Rights and authority events

- consent granted, changed, withdrawn or expired;
- delegate permission granted, changed, withdrawn or expired;
- attempted access outside role, tenant, purpose or consent scope;
- proposed disclosure of participant information;
- approval envelope missing, expired, replayed or incomplete;
- participant correction or objection;
- accessibility/communication preference update relevant to the active task.

#### Service-commitment events

- support request accepted or declined;
- worker/provider confirmation;
- shift cancellation or no-show;
- agreed backup unavailable;
- material schedule change;
- transport dependency cancelled or materially delayed;
- service agreement expiry or material change;
- pricing/quote/invoice mismatch;
- credential or required competency expiry;
- continuity-plan activation condition met.

#### Participant-selected watches

Examples:

- “Tell me if my regular worker cancels.”
- “Tell me if anyone accesses my support profile.”
- “Tell me if a required credential expires.”
- “Tell me if an invoice is higher than the agreed quote.”
- “Tell me if transport disruption threatens my support plan.”

Participant-selected watches must be explicit, understandable, reversible and independently revocable.

#### Accountability events

- complaint lodged, acknowledged, updated or overdue;
- incident intake acknowledged or overdue;
- promised corrective action overdue;
- required human review not completed by the agreed timeframe;
- participant-accessibility request not fulfilled;
- service recovery action not completed;
- Sentinel-generated escalation closed without the required human decision record.

### 6.2 Prohibited observation

The Sentinel must not perform or request:

- always-on microphone monitoring;
- always-on camera monitoring;
- ambient home sensing by default;
- continuous emotional-state inference;
- covert analysis of private conversations;
- general location tracking unrelated to an active participant-approved task;
- facial-expression or voice-stress profiling;
- capacity inference from communication style;
- diagnosis inference;
- abuse/neglect substantiation by AI;
- behavioural-risk scoring;
- worker trustworthiness scoring derived from inferred behaviour;
- productivity surveillance;
- social-relationship profiling;
- advertising or marketing profiling;
- insurance or employment risk profiling;
- indefinite storage of raw contextual data simply because it might later be useful.

## 7. Core invariants

### 7.1 Consent

1. Every Sentinel evaluation has a declared purpose.
2. Every personal-data input is tied to a data class and minimum-necessary field set.
3. Optional Sentinel watches require explicit opt-in.
4. Withdrawal stops new use immediately except where a lawful retention or safety duty requires otherwise.
5. Sentinel-derived signals never create consent.
6. Silence, behaviour, disability, communication style or historical acceptance never imply consent.

### 7.2 Dignity

1. The participant remains the decision-maker wherever law permits.
2. Safety controls must use the least restrictive response that addresses the concrete risk.
3. The participant may choose informed risk where a specific legal duty does not prevent it.
4. The Sentinel must not describe ordinary disabled life as inherently risky, burdensome or tragic.
5. Human support must be accessible without taking ownership of the participant’s decision.
6. A participant may ask the Sentinel to stop, narrow or change a watch at any time.

### 7.3 Agency

1. The Sentinel may inform, ask, propose or route.
2. It must not auto-assign workers.
3. It must not silently cancel support.
4. It must not approve invoices or payments.
5. It must not alter a support plan.
6. It must not disclose sensitive information without current authority.
7. It must not decide capacity, abuse, reportability or restrictive practice.
8. It must not close an incident or complaint.

### 7.4 Transparency

Every non-trivial Sentinel outcome must be explainable in accessible language:

- what happened;
- which concrete event triggered the check;
- what rule was applied;
- which data was used;
- what was not inferred;
- whether the participant must confirm anything;
- whether human review is available or required;
- how to correct or challenge the result.

## 8. Decision model

Use a bounded deterministic decision enum:

```ts
type SentinelDecisionType =
  | "NO_ACTION"
  | "INFORM"
  | "REQUEST_CONFIRMATION"
  | "OFFER_ALTERNATIVES"
  | "ROUTE_HUMAN_REVIEW"
  | "BLOCK_UNAUTHORISED_PROCESSING";
```

`BLOCK_UNAUTHORISED_PROCESSING` is limited to deterministic failures such as missing authority, invalid consent, cross-tenant access, prohibited disclosure, invalid approval envelope or a required credential/competency gate that is contractually defined.

The Sentinel does **not** block ordinary life choices merely because a model considers them risky.

## 9. Proposed contracts

### 9.1 SentinelEvent

```ts
interface SentinelEvent {
  eventId: string;
  occurredAt: string;
  category:
    | "rights"
    | "service_commitment"
    | "participant_watch"
    | "accountability";
  type: string;
  participantId: string;
  tenantId: string;
  actorId?: string;
  purpose: string;
  dataRefs: string[];
  consentReceiptIds: string[];
  authorityDecisionId?: string;
  payload: Record<string, unknown>;
}
```

### 9.2 ParticipantWatch

```ts
interface ParticipantWatch {
  watchId: string;
  participantId: string;
  conditionType: string;
  scope: Record<string, unknown>;
  notificationPreference: string;
  enabled: boolean;
  createdAt: string;
  consentReceiptId: string;
  expiresAt?: string;
}
```

The first implementation should use a small allowlist of condition types. It must not accept free-form “monitor everything about X” rules.

### 9.3 SentinelDecision

```ts
interface SentinelDecision {
  decision: SentinelDecisionType;
  reasonCodes: string[];
  participantId: string;
  eventId: string;
  participantConfirmationRequired: boolean;
  humanReviewRequired: boolean;
  explanation: {
    plainLanguage: string;
    evidenceRefs: string[];
    nextSteps: string[];
    correctionPath: string;
  };
}
```

## 10. First vertical slice: Rights Sentinel

The first implementation slice should be deterministic and model-free.

### In scope

- missing/expired participant consent;
- revoked delegate authority;
- proposed overbroad disclosure;
- cross-participant / cross-tenant access attempt;
- invalid or replayed approval envelope;
- participant objection/correction signal;
- required communication preference omitted from an active Care workflow where the preference is operationally relevant;
- accessible explanation and correction route;
- audit event for every Sentinel decision.

### Out of scope

- behavioural prediction;
- emotional inference;
- proactive abuse detection;
- clinical monitoring;
- continuous geolocation;
- automatic reportability assessment;
- worker suspension;
- automated incident closure;
- autonomous service reassignment.

## 11. Second vertical slice: Continuity Sentinel

Only after the Rights Sentinel has passed tests and human review.

### Candidate events

- `shift.cancelled`;
- `shift.no_show`;
- `worker.credential.expired`;
- `service_agreement.expiring`;
- `transport.cancelled`;
- `transport.material_delay`;
- `backup.unavailable`;
- `participant.preferred_backup.available`;
- `invoice.quote_variance`;
- `complaint.response_overdue`.

The default response is to **inform and offer participant-controlled alternatives**, not automatically rearrange care.

## 12. Integration points

The implementation should extend, not duplicate:

- `lib/ai/platform/guardian/contracts.ts`
- `lib/ai/platform/guardian/guardian-policy.ts`
- `lib/ai/platform/guardian/guardian-service.ts`
- `lib/ai/platform/guardian/audit.ts`
- `lib/ai/platform/policies/safeguarding-gate.ts`
- `lib/ai/platform/types/authority.ts`
- `lib/consent/`
- `lib/authority/`
- `lib/audit/`
- `lib/incidents/incident-service.ts`
- `lib/care/worker-eligibility.ts`
- `lib/workforce/readiness/evaluate.ts`
- existing continuity/recovery event infrastructure where contracts already exist.

Proposed new bounded module:

```text
lib/ai/platform/guardian/sentinel/
  contracts.ts
  event-policy.ts
  consent-dignity-policy.ts
  rights-sentinel.ts
  participant-watch-policy.ts
  explanation.ts
  audit.ts
  index.ts
```

Do not create a standalone runtime service in v1.

## 13. Feature flags

All new behaviour must fail closed or degrade to existing manual/deterministic paths.

Proposed flags:

```text
MAPABLE_CARE_SENTINEL_ENABLED=false
MAPABLE_CARE_SENTINEL_RIGHTS_ENABLED=false
MAPABLE_CARE_SENTINEL_PARTICIPANT_WATCHES_ENABLED=false
MAPABLE_CARE_SENTINEL_CONTINUITY_ENABLED=false
```

No flag may enable model inference in the first slice.

## 14. Accessibility requirements

WCAG 2.2 AA is the baseline, with manual assistive-technology validation.

The participant must be able to:

- create, review, pause and revoke a watch by keyboard;
- use the same flow with a screen reader;
- complete the flow using switch access or voice-independent controls;
- receive plain-language explanations;
- use AAC-compatible text interaction;
- request Easy Read or human-assisted explanation;
- understand status without relying on colour alone;
- reach complaint, correction and human support paths from every Sentinel decision surface.

No Sentinel warning may become an inaccessible modal trap.

## 15. Privacy and retention

1. Evaluate events using references and minimum necessary data wherever possible.
2. Do not copy full support notes into Sentinel audit records.
3. Store the decision, reason codes, policy version, relevant evidence references and actor/authority context.
4. Raw event payload retention follows the source system’s retention rules; Sentinel does not create a parallel archive.
5. Participant watches have explicit lifecycle and deletion/disable behaviour.
6. Sensitive model processing is not part of v1.

## 16. Human-review boundaries

Human review is required when:

- safeguarding cues invoke the existing safeguarding gate;
- a participant challenges a consequential block and policy cannot resolve it deterministically;
- a credential/competency exception is requested;
- incident reportability may need assessment;
- a complaint concerns retaliation, abuse, neglect, exploitation or sexual misconduct;
- a proposed response would materially alter an ongoing support arrangement without participant confirmation;
- policy, law or service responsibility is ambiguous.

The human reviewer must see the participant’s communication/access preferences relevant to the review and must not infer authority from family presence or communication difficulty.

## 17. Evaluation and acceptance tests

### Rights / consent

- revoked consent blocks new disclosure;
- expired delegate grant is not treated as valid;
- cross-tenant access fails closed;
- missing consent never gets inferred from previous behaviour;
- participant correction updates the active interpretation without deleting the audit trail;
- an AI signal cannot override deterministic consent or authority policy.

### Dignity / agency

- high-risk-looking but lawful participant choice does not trigger automatic cancellation;
- participant is offered alternatives rather than auto-reassigned support;
- “I understand and still choose this” remains possible where no specific legal duty prohibits it;
- refusal of a Sentinel suggestion does not silently downgrade service access;
- participant can disable optional watches.

### Anti-surveillance

- no event schema permits ambient audio/video ingestion;
- no participant risk-score field exists;
- no worker trustworthiness-score field exists;
- general location history is rejected as a Sentinel watch input;
- emotion/face/voice-stress fields are rejected;
- free-form “monitor everything” watch requests fail validation.

### Accessibility

- complete watch lifecycle passes keyboard-only testing;
- screen-reader labels and live-region announcements are understandable;
- warning and confirmation UI has no timeout trap;
- plain-language and human-assisted alternatives work;
- no action depends on drag, fine motor precision, speech or colour perception.

### Reliability

- duplicate events are idempotent;
- replayed approval envelopes are rejected;
- stale event versions do not overwrite newer consent state;
- disabled Sentinel flags preserve existing non-AI/manual flows;
- audit failures fail safely for consequential decisions.

## 18. Observability and evidence

Track operational control evidence, not surveillance metrics.

Allowed metrics include:

- Sentinel evaluations by event type;
- decisions by reason code;
- participant confirmations accepted/declined;
- watch creation/revocation rates;
- human-review routing and resolution times;
- continuity alerts resolved;
- false-positive / correction rate;
- accessibility defect rate;
- duplicate/replay protection events;
- service failure recurrence after corrective action.

Do not optimise for:

- time spent monitored;
- amount of participant data collected;
- emotional disclosures;
- engagement addiction;
- worker productivity surveillance;
- “risk score reduction”.

## 19. Governance and challenge

Every Sentinel policy version must have:

- an owner;
- version identifier;
- documented rationale;
- participant/lived-experience review for material policy changes;
- accessibility review;
- privacy/security review;
- rollback path;
- evaluation suite;
- public-facing explanation appropriate to the released capability.

Participants must have a correction/challenge path and must be able to see why a Sentinel intervention occurred.

## 20. Rollout

### Phase 0 — design and test harness

- contracts;
- anti-surveillance schema validation;
- reason-code registry;
- deterministic policy tests;
- no production activation.

### Phase 1 — Rights Sentinel

- shadow mode in development/test;
- consent/authority/accessibility checks;
- audit and explanation;
- manual review of decision traces;
- feature flag default off.

### Phase 2 — Participant-selected watches

- small allowlisted watch set;
- explicit opt-in and revocation;
- accessible notifications;
- no free-form ambient monitoring.

### Phase 3 — Continuity Sentinel

- shift, credential, transport and service-agreement events;
- participant-controlled alternatives;
- human escalation where needed;
- no autonomous reassignment.

### Phase 4 — Quality/accountability learning

- de-identified, thresholded organisational trend analysis;
- complaint/incident/continuity learning;
- no individual behaviour scoring;
- Board and participant-advisory reporting.

## 21. Release gates

No public activation until all applicable gates are evidenced:

1. consent/authority negative tests pass;
2. anti-surveillance tests pass;
3. WCAG 2.2 AA automated checks plus manual AT testing pass;
4. participant correction and revocation work end-to-end;
5. complaint/incident/human escalation routes work;
6. audit and reason codes are complete;
7. kill switch works;
8. privacy/security review completed;
9. participant/lived-experience review completed;
10. legal/NDIS review completed for any regulated Care workflow;
11. no claim of compliance or production safety exceeds available assurance evidence.

## 22. Non-goals

This design does not establish that MapAble is NDIS registered, clinically governed, independently safe, APP compliant, or production ready. It does not authorise high-intensity support, restrictive practices, emergency triage, clinical decision support or statutory reporting.

## 23. Implementation sequence after spec approval

1. Write failing contract tests for permitted/prohibited event schemas.
2. Add Sentinel contracts and reason codes.
3. Write failing consent/dignity policy tests.
4. Implement deterministic Rights Sentinel.
5. Integrate with existing Guardian policy composition behind flags.
6. Add audit/explanation contract.
7. Add API/internal service tests without exposing a new public API unless required.
8. Run anti-surveillance, authority, tenant-isolation and accessibility tests.
9. Add participant-watch contracts only after Rights Sentinel passes.
10. Do not implement Continuity Sentinel until Phase 1 assurance evidence exists.

## 24. Success condition

The first release succeeds if MapAble can demonstrate that, for a bounded Care workflow, the Sentinel:

- prevents unauthorised data use;
- preserves participant correction and revocation;
- explains its intervention accessibly;
- routes genuine ambiguity to accountable humans;
- never turns disability, communication style or ordinary life into a behavioural risk profile;
- produces auditable evidence without constructing a surveillance dataset;
- leaves the participant, not the Sentinel, in control of ordinary life choices.
