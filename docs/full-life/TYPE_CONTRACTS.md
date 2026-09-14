# Full Life TypeScript Contracts — Specification

**Status:** implementation-ready type specification; no runtime authority is added by this document.

**Target implementation path:** `lib/platform/full-life/contracts.ts`

**Design rule:** these contracts reference existing canonical records. They do not create another participant profile, consent ledger, authority store, mission store, action store, payment ledger or risk engine.

## 1. Existing contracts to reuse

The current repository already defines:

- `MapAbleMissionRequest`, `MapAbleMissionPlan`, `MissionGraph`, `EvidenceBundle`, `ContinuityAlert`, `MissionActionProposal` in `lib/ai/platform/missions/types.ts`;
- authority ceilings and participant / human review contracts in the AI platform;
- AURA `HarnessDecision` for operational / agentic risk;
- canonical consent / authority / disclosure infrastructure elsewhere in Core / RightsOS;
- synthetic evaluation contracts in `lib/ai/platform/evaluations/types.ts`.

Full Life types must import or reference these rather than copy their data.

## 2. Proposed contract surface

The following is the intended compile-ready shape for the additive type module.

```ts
import type { MapAbleMissionPlan } from "@/lib/ai/platform/missions/types";

export const FULL_LIFE_RULE_IDS = [
  "FL-001",
  "FL-002",
  "FL-003",
  "FL-004",
  "FL-005",
  "FL-006",
  "FL-007",
  "FL-008",
  "FL-009",
  "FL-010",
  "FL-011",
  "FL-012",
] as const;

export type FullLifeRuleId = (typeof FULL_LIFE_RULE_IDS)[number];

export const FULL_LIFE_ASSURANCE_DIMENSIONS = [
  "agency",
  "authority",
  "accessibility",
  "evidence_integrity",
  "continuity",
  "safeguarding",
  "privacy",
  "resources",
  "financial_integrity",
  "commercial_integrity",
  "resilience",
  "reversibility_remedy",
] as const;

export type FullLifeAssuranceDimension =
  (typeof FULL_LIFE_ASSURANCE_DIMENSIONS)[number];

export const FULL_LIFE_FINDING_STATES = [
  "PASS",
  "CAUTION",
  "UNKNOWN",
  "FAIL",
  "NOT_APPLICABLE",
] as const;

export type FullLifeFindingState =
  (typeof FULL_LIFE_FINDING_STATES)[number];

export const FULL_LIFE_HARNESS_DECISIONS = [
  "PRESENT",
  "PROPOSE",
  "REVIEW_REQUIRED",
  "DEGRADE_TO_MANUAL",
  "BLOCK_EXECUTION",
  "STOP_AND_ESCALATE",
] as const;

export type FullLifeHarnessDecision =
  (typeof FULL_LIFE_HARNESS_DECISIONS)[number];

export const FULL_LIFE_RESOURCE_TYPES = [
  "money",
  "participant_time",
  "worker_capacity",
  "transport_capacity",
  "funding_authority",
  "mainstream_service",
  "community_resource",
  "informal_support",
] as const;

export type FullLifeResourceType =
  (typeof FULL_LIFE_RESOURCE_TYPES)[number];

export const FULL_LIFE_RESOURCE_STATES = [
  "VERIFIED_AVAILABLE",
  "PARTICIPANT_OFFERED",
  "AVAILABLE_WITH_CONDITIONS",
  "UNKNOWN",
  "NOT_AUTHORISED",
  "UNAVAILABLE",
  "DECLINED",
] as const;

export type FullLifeResourceState =
  (typeof FULL_LIFE_RESOURCE_STATES)[number];

export const FULL_LIFE_PRIORITY_KINDS = [
  "HARD_CONSTRAINT",
  "PRIORITY",
  "PREFERENCE",
] as const;

export type FullLifePriorityKind =
  (typeof FULL_LIFE_PRIORITY_KINDS)[number];

export interface FullLifeParticipantPriority {
  id: string;
  kind: FullLifePriorityKind;
  statement: string;
  source: "PARTICIPANT_CONFIRMED";
  lifeIntentId?: string;
  confirmedAt: string;
  expiresAt?: string | null;
}

export interface FullLifeResourceItem {
  type: FullLifeResourceType;
  state: FullLifeResourceState;
  label: string;
  evidenceRefs: string[];
  limitations: string[];
  estimatedAmount?: number | null;
  currency?: "AUD" | null;
  validUntil?: string | null;
}

export interface FullLifeResourceEnvelope {
  missionId: string;
  items: FullLifeResourceItem[];
  assumptions: string[];
  unknowns: string[];
}

export interface FullLifeCommercialInfluence {
  optionRef: string;
  mapAbleOwnedService: boolean;
  sponsored: boolean;
  referralFeeExpected: boolean;
  commissionExpected: boolean;
  otherConflict?: string | null;
  disclosureText: string;
}

export interface FullLifeHarnessFinding {
  id: string;
  ruleId: FullLifeRuleId;
  dimension: FullLifeAssuranceDimension;
  state: FullLifeFindingState;
  title: string;
  reason: string;
  evidenceRefs: string[];
  affectedMissionNodeIds: string[];
  affectedProposalIds: string[];
  hardFail: boolean;
  remediation?: string | null;
  humanReviewReason?: string | null;
}

export interface FullLifeAuraReference {
  /** Reference only — AURA remains the risk engine. */
  evaluationRef: string;
  outcome: "APPROVED" | "MITIGATED" | "DENIED" | "HITL_PENDING";
  requiresHITL: boolean;
  guardrailIds: string[];
}

export interface FullLifeHarnessInput {
  harnessVersion: string;
  missionId: string;
  participantId: string;
  actorId: string;
  lifeIntentId?: string | null;

  /** Hash / version bind the assessment to the exact plan snapshot. */
  missionPlanVersion?: number | null;
  missionPlanHash: string;

  /** Optional proposal-level preflight. */
  proposalIds: string[];

  participantPriorities: FullLifeParticipantPriority[];
  authorityEvidenceRefs: string[];
  consentEvidenceRefs: string[];
  evidenceRefs: string[];
  resourceEnvelope: FullLifeResourceEnvelope;
  commercialInfluence: FullLifeCommercialInfluence[];
  aura?: FullLifeAuraReference | null;

  evaluatedAt: string;
}

export interface FullLifeOptionTradeoff {
  optionRef: string;
  benefits: string[];
  drawbacks: string[];
  unknowns: string[];
  conflictsWithPriorityIds: string[];
  satisfiesHardConstraintIds: string[];
  commercialInfluenceRefs: string[];
}

export interface FullLifeHarnessResult {
  harnessVersion: string;
  missionId: string;
  missionPlanHash: string;
  evaluatedAt: string;

  decision: FullLifeHarnessDecision;
  findings: FullLifeHarnessFinding[];
  optionTradeoffs: FullLifeOptionTradeoff[];

  participantDecisionRequired: boolean;
  humanReviewRequired: boolean;

  permittedProposalIds: string[];
  blockedProposalIds: string[];

  unresolvedQuestions: string[];
  evidenceRefs: string[];

  /** Explicitly multi-dimensional; no aggregate Full Life score. */
  byDimension: Partial<
    Record<FullLifeAssuranceDimension, FullLifeFindingState>
  >;
}

export interface FullLifeMissionProjection {
  /** Existing mission plan is the source, not a duplicated mission record. */
  mission: Pick<
    MapAbleMissionPlan,
    | "missionId"
    | "objective"
    | "status"
    | "domains"
    | "missionGraph"
    | "continuityAlerts"
    | "recommendations"
    | "actionProposals"
    | "humanReviewItems"
    | "authorityCeiling"
    | "traceId"
    | "planVersion"
  >;

  harness: FullLifeHarnessResult;

  participantView: {
    ready: string[];
    needsYourChoice: string[];
    needsMoreInformation: string[];
    humanHelpAvailable: boolean;
    nonAiPathAvailable: boolean;
  };
}
```

## 3. Contract invariants

### No `FullLifeScore`

The module must not define a whole-person or whole-life scalar score. `byDimension` is deliberately categorical and multidimensional.

### No copied authority

`authorityEvidenceRefs` and `consentEvidenceRefs` are references to canonical records. The Full Life module must not create `FullLifeConsent`, `FullLifeDelegate`, `FullLifeAuthorityGrant` or equivalent stores.

### No copied mission store

`missionId`, plan version and plan hash bind the result to the existing mission. Full Life does not own mission lifecycle.

### No copied AURA implementation

`FullLifeAuraReference` contains only the minimum output required to reason about operational risk. It must not calculate gamma, risk dimensions or mitigations.

### Informal support is never assumed

`informal_support` must enter the resource envelope as `PARTICIPANT_OFFERED`, `VERIFIED_AVAILABLE`, `DECLINED`, `UNKNOWN` or another explicit state. Absence must not be transformed into availability.

### Priority is participant-authored

The initial implementation permits only `PARTICIPANT_CONFIRMED` priorities. Model-inferred preferences may be suggested to the participant, but must not enter the harness as a priority until explicitly confirmed.

### Hard constraints cannot be silently traded away

An option that conflicts with a `HARD_CONSTRAINT` cannot become preferred because of cost, convenience, sponsorship, model confidence or provider availability.

## 4. Harness decision semantics

| Decision | Meaning | Operational effect |
|---|---|---|
| `PRESENT` | Information may be shown | no authority to execute |
| `PROPOSE` | May become a participant-selectable proposal | still requires existing approval rules |
| `REVIEW_REQUIRED` | Accountable human / specialist review required | no consequential execution pending review |
| `DEGRADE_TO_MANUAL` | Automated route cannot safely complete | preserve accessible non-AI / human path |
| `BLOCK_EXECUTION` | MapAble is not authorised or proposal violates a hard invariant | block the system action, not the participant’s underlying choice |
| `STOP_AND_ESCALATE` | genuine safeguarding / emergency / integrity condition | hand off to accountable human process |

## 5. Planned adapter boundaries

Implementation should expose pure functions first:

```ts
buildFullLifeHarnessInput(...): FullLifeHarnessInput

evaluateFullLifeHarness(
  input: FullLifeHarnessInput,
): FullLifeHarnessResult

projectFullLifeMission(
  mission: MapAbleMissionPlan,
  harness: FullLifeHarnessResult,
): FullLifeMissionProjection
```

No function above may execute a booking, payment, disclosure, assignment or regulatory action.

A later adapter may pass `permittedProposalIds` into the existing Governed Action Kernel. That adapter must re-check current authority / consent at execution time; a prior harness pass is not a perpetual authorisation token.

## 6. Versioning

Start with `FULL_LIFE_HARNESS_VERSION = "0.1.0"` in shadow / evaluation mode.

Any change that modifies a hard-fail rule, decision semantics or authority assumption requires:

- a version bump;
- scenario updates;
- constitutional review;
- regression comparison against prior harness outputs;
- human approval before activation.
