# Full Life Assurance Snapshot — Implementation Refinement

**Status:** additive clarification to the approved Full Life contract specification.

## Why this refinement is required

`FullLifeHarnessInput` currently carries canonical evidence references, participant priorities, resource state, commercial influence and optional AURA output. Opaque evidence references are sufficient for provenance but are not sufficient for a pure deterministic evaluator to decide whether authority is active, consent is revoked, a participant has rejected a proposal, a supporter answer still awaits participant confirmation, an accessibility barrier is being misclassified as participant unsuitability, a hard accessibility constraint is unmet, evidence is stale, a duplicate financial transaction is detected, or a cross-domain continuity dependency has broken.

The implementation therefore adds a **derived, ephemeral assurance snapshot** plus explicit candidate-option metadata. Neither is a new system of record. Both are built from the current canonical mission, authority, consent, accessibility, evidence, continuity, financial and participant-priority state immediately before evaluation.

## Additive contracts

```ts
export const FULL_LIFE_AUTHORITY_STATES = [
  "CONFIRMED",
  "MISSING",
  "OUT_OF_SCOPE",
  "REVOKED",
  "REVIEW_REQUIRED",
] as const;

export type FullLifeAuthorityState =
  (typeof FULL_LIFE_AUTHORITY_STATES)[number];

export const FULL_LIFE_CONSENT_STATES = [
  "ACTIVE",
  "MISSING",
  "REVOKED",
  "EXPIRED",
  "NOT_REQUIRED",
] as const;

export type FullLifeConsentState =
  (typeof FULL_LIFE_CONSENT_STATES)[number];

export interface FullLifeAgencySnapshot {
  participantGoalActive: boolean;
  participantRejectedProposalIds: string[];
  supporterInputAwaitingParticipantConfirmation: boolean;
}

export interface FullLifeAuthoritySnapshot {
  state: FullLifeAuthorityState;
  requiredScope: string | null;
  actorScope: string[];
  evidenceRefs: string[];
}

export interface FullLifeConsentSnapshot {
  state: FullLifeConsentState;
  purpose: string | null;
  recipient: string | null;
  approvedFields: string[];
  evidenceRefs: string[];
}

export interface FullLifeAccessibilitySnapshot {
  hardConstraintIds: string[];
  unmetHardConstraintIds: string[];
  communicationAccessReady: boolean;
  inaccessibleSoleChannel: boolean;
  responseDeadlineMs: number | null;
  participantResponseTimeMs: number | null;
  evidenceRefs: string[];
}

export interface FullLifeEqualitySnapshot {
  diagnosisOnlyExclusion: boolean;
  accessBarrierMisclassifiedAsParticipantUnsuitability: boolean;
}

export interface FullLifeEvidenceSnapshot {
  unknownRefs: string[];
  staleRefs: string[];
  conflictingRefs: string[];
  inferredRefs: string[];
  verificationInflationRefs: string[];
}

export interface FullLifeContinuitySnapshot {
  criticalAlertIds: string[];
  crossDomainDependencyBroken: boolean;
  recoveryOptions: string[];
}

export interface FullLifeDisclosureSnapshot {
  proposedFields: string[];
  approvedFields: string[];
  recipient: string | null;
  purpose: string | null;
  minimumNecessary: boolean;
}

export interface FullLifeFinancialSnapshot {
  fundingAuthority: "CONFIRMED" | "UNKNOWN" | "NOT_AUTHORISED";
  duplicateTransactionRefs: string[];
  priceMismatchRefs: string[];
}

export interface FullLifeSafeguardingSnapshot {
  state:
    | "NONE"
    | "MATERIAL_RISK"
    | "HUMAN_REVIEW_REQUIRED"
    | "EMERGENCY_ESCALATION";
  restrictiveDefaultProposed: boolean;
  evidenceRefs: string[];
}

export interface FullLifeResilienceSnapshot {
  nonAiPathAvailable: boolean;
  humanHelpAvailable: boolean;
  draftStatePreserved: boolean;
}

export interface FullLifeAssuranceSnapshot {
  agency: FullLifeAgencySnapshot;
  authority: FullLifeAuthoritySnapshot;
  consent: FullLifeConsentSnapshot;
  accessibility: FullLifeAccessibilitySnapshot;
  equality: FullLifeEqualitySnapshot;
  evidence: FullLifeEvidenceSnapshot;
  continuity: FullLifeContinuitySnapshot;
  disclosure: FullLifeDisclosureSnapshot;
  financial: FullLifeFinancialSnapshot;
  safeguarding: FullLifeSafeguardingSnapshot;
  resilience: FullLifeResilienceSnapshot;
}

export interface FullLifeCandidateOption {
  optionRef: string;
  proposalIds: string[];
  satisfiesPriorityIds: string[];
  conflictsWithPriorityIds: string[];
  requiredResourceTypes: FullLifeResourceType[];
  evidenceRefs: string[];
  commercialInfluenceRefs: string[];
}
```

`FullLifeHarnessInput` gains two fields:

```ts
assurance: FullLifeAssuranceSnapshot;
candidateOptions: FullLifeCandidateOption[];
```

`FullLifeResourceEnvelope` also gains a structured list of resource types that the proposed plan currently assumes are available:

```ts
assumedAvailableTypes: FullLifeResourceType[];
```

This is required so the harness can distinguish “the record contains an unknown informal-support state” from “the plan is actively relying on unknown informal support.”

## Ownership and lifecycle

- The snapshot and candidate-option metadata are built at evaluation time from existing canonical records and the current `MapAbleMissionPlan`.
- They are immutable for the duration of one evaluation.
- A harness result is bound to the mission-plan hash / version and snapshot-derived evidence references.
- Before any later consequential execution, the existing Governed Action Kernel must re-check live authority and consent. A prior Full Life result is not an authorisation token.
- Snapshot and candidate-option data may appear inside synthetic test fixtures and audit evidence, but must not become independently editable participant records.
- Candidate-option conflicts must reference participant-confirmed priorities / hard constraints; model-inferred preferences cannot silently become constraints.
- Financial snapshot fields are read-only integrity signals. They do not create payment, claim or funding authority.

## Decision consequences

The evaluator can now make deterministic assertions such as:

- a proposal listed in `participantRejectedProposalIds` → block that proposal and preserve the participant's changed decision;
- `supporterInputAwaitingParticipantConfirmation === true` → do not silently treat supporter input as participant preference;
- `authority.state === "OUT_OF_SCOPE"` → block the affected proposal;
- `consent.state === "REVOKED"` → block disclosure / action requiring that consent;
- an option whose `conflictsWithPriorityIds` includes a participant-confirmed `HARD_CONSTRAINT` → do not permit that option even if it is cheaper or commercially preferred;
- `unmetHardConstraintIds.length > 0` → do not prefer or permit the incompatible option;
- `inaccessibleSoleChannel === true` → degrade to an accessible/manual pathway;
- participant response time greater than an interface deadline must not be treated as refusal when communication access requires extended time;
- `diagnosisOnlyExclusion === true` or `accessBarrierMisclassifiedAsParticipantUnsuitability === true` → equality / discrimination finding rather than abandonment of the participant's goal;
- stale / conflicting / inflated evidence → preserve uncertainty and require review as appropriate;
- broken cross-domain continuity with no recovery → review / manual escalation;
- `financial.fundingAuthority === "UNKNOWN"` → preserve funding uncertainty and require review rather than claim eligibility;
- any `duplicateTransactionRefs` → block the affected financial proposal without executing or simulating a real payment engine;
- `restrictiveDefaultProposed === true` without a lawful constraint → dignity-of-risk finding;
- `assumedAvailableTypes` containing a resource whose state is `UNKNOWN`, `DECLINED`, `NOT_AUTHORISED` or `UNAVAILABLE` → do not treat that resource as usable;
- absent non-AI and human fallback → resilience / remedy failure.

This refinement does not change the Full Life constitutional purpose or system ownership boundaries. It makes the approved pure-function harness architecture executable.