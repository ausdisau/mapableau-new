import type { MapAbleMissionPlan } from "@/lib/ai/platform/missions/types";

export const FULL_LIFE_HARNESS_VERSION = "0.1.0" as const;

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

export type FullLifeFindingState = (typeof FULL_LIFE_FINDING_STATES)[number];

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

export type FullLifeResourceType = (typeof FULL_LIFE_RESOURCE_TYPES)[number];

export const FULL_LIFE_RESOURCE_STATES = [
  "VERIFIED_AVAILABLE",
  "PARTICIPANT_OFFERED",
  "AVAILABLE_WITH_CONDITIONS",
  "UNKNOWN",
  "NOT_AUTHORISED",
  "UNAVAILABLE",
  "DECLINED",
] as const;

export type FullLifeResourceState = (typeof FULL_LIFE_RESOURCE_STATES)[number];

export const FULL_LIFE_PRIORITY_KINDS = [
  "HARD_CONSTRAINT",
  "PRIORITY",
  "PREFERENCE",
] as const;

export type FullLifePriorityKind = (typeof FULL_LIFE_PRIORITY_KINDS)[number];

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

export type FullLifeConsentState = (typeof FULL_LIFE_CONSENT_STATES)[number];

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
  assumedAvailableTypes: FullLifeResourceType[];
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
  /** Reference only — AURA remains the operational-risk engine. */
  evaluationRef: string;
  outcome: "APPROVED" | "MITIGATED" | "DENIED" | "HITL_PENDING";
  requiresHITL: boolean;
  guardrailIds: string[];
}

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

export interface FullLifeHarnessInput {
  harnessVersion: string;
  missionId: string;
  participantId: string;
  actorId: string;
  lifeIntentId?: string | null;
  missionPlanVersion?: number | null;
  missionPlanHash: string;
  proposalIds: string[];
  participantPriorities: FullLifeParticipantPriority[];
  authorityEvidenceRefs: string[];
  consentEvidenceRefs: string[];
  evidenceRefs: string[];
  resourceEnvelope: FullLifeResourceEnvelope;
  commercialInfluence: FullLifeCommercialInfluence[];
  assurance: FullLifeAssuranceSnapshot;
  candidateOptions: FullLifeCandidateOption[];
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
  byDimension: Partial<Record<FullLifeAssuranceDimension, FullLifeFindingState>>;
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
