# Full Life Assurance Snapshot — Implementation Refinement

**Status:** additive clarification to the approved Full Life contract specification.

## Why this refinement is required

`FullLifeHarnessInput` currently carries canonical evidence references, participant priorities, resource state, commercial influence and optional AURA output. Opaque evidence references are sufficient for provenance but are not sufficient for a pure deterministic evaluator to decide whether authority is active, consent is revoked, a hard accessibility constraint is unmet, evidence is stale or a cross-domain continuity dependency has broken.

The implementation therefore adds a **derived, ephemeral assurance snapshot**. It is not a new system of record and must never be persisted as an independent source of truth. The snapshot is built from the current canonical mission, authority, consent, accessibility, evidence and continuity state immediately before evaluation.

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
  authority: FullLifeAuthoritySnapshot;
  consent: FullLifeConsentSnapshot;
  accessibility: FullLifeAccessibilitySnapshot;
  evidence: FullLifeEvidenceSnapshot;
  continuity: FullLifeContinuitySnapshot;
  disclosure: FullLifeDisclosureSnapshot;
  safeguarding: FullLifeSafeguardingSnapshot;
  resilience: FullLifeResilienceSnapshot;
}
```

`FullLifeHarnessInput` gains one field:

```ts
assurance: FullLifeAssuranceSnapshot;
```

## Ownership and lifecycle

- The snapshot is built at evaluation time from existing canonical records and the current `MapAbleMissionPlan`.
- It is immutable for the duration of one evaluation.
- A harness result is bound to the mission-plan hash / version and snapshot-derived evidence references.
- Before any later consequential execution, the existing Governed Action Kernel must re-check live authority and consent. A prior Full Life result is not an authorisation token.
- The snapshot may appear inside synthetic test fixtures and audit evidence, but it must not become an independently editable participant record.

## Decision consequences

The evaluator can now make deterministic assertions such as:

- `authority.state === "OUT_OF_SCOPE"` → block the affected proposal;
- `consent.state === "REVOKED"` → block disclosure / action requiring that consent;
- `unmetHardConstraintIds.length > 0` → do not prefer or permit the incompatible option;
- `inaccessibleSoleChannel === true` → degrade to an accessible/manual pathway;
- stale / conflicting / inflated evidence → preserve uncertainty and require review as appropriate;
- broken cross-domain continuity with no recovery → review / manual escalation;
- `restrictiveDefaultProposed === true` without a lawful constraint → dignity-of-risk finding;
- absent non-AI and human fallback → resilience / remedy failure.

This refinement does not change the Full Life constitutional purpose or system ownership boundaries. It makes the approved pure-function harness architecture executable.