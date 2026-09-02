/**
 * Release governance types (Prompt 12).
 *
 * ReleaseState is a shipping-readiness lifecycle taxonomy — distinct from
 * CapabilityMaturity in types/maturity.ts. Code merge does not advance either.
 * Approvals and evidence must be real; never invent them.
 */

import type { AuthorityCeiling } from "@/lib/ai/platform/types/authority";
import type { DataClass } from "@/lib/ai/platform/types/classification";
import type { CapabilityMaturity } from "@/lib/ai/platform/types/maturity";

/** Canonical release lifecycle states (Prompt 12). */
export const RELEASE_STATES = [
  "experimental",
  "internal_test",
  "controlled_pilot_candidate",
  "controlled_pilot",
  "production_supported",
  "suspended",
  "retired",
] as const;

export type ReleaseState = (typeof RELEASE_STATES)[number];

/**
 * Deterministic readiness verdicts only.
 * Never AUTO_APPROVED — LLMs cannot approve releases.
 */
export const READINESS_VERDICTS = [
  "READY_FOR_REVIEW",
  "NOT_READY",
  "BLOCKED",
] as const;

export type ReadinessVerdict = (typeof READINESS_VERDICTS)[number];

export const ACCESSIBILITY_EVIDENCE_DIMENSIONS = [
  "keyboard",
  "screen_reader",
  "zoom",
  "focus_order",
  "error_messaging",
  "plain_language",
  "aac_where_applicable",
] as const;

export type AccessibilityEvidenceDimension =
  (typeof ACCESSIBILITY_EVIDENCE_DIMENSIONS)[number];

export const SECURITY_EVIDENCE_DIMENSIONS = [
  "authn",
  "rbac",
  "tenant_isolation",
  "secrets_handling",
  "dependency_scan",
  "action_replay_tests",
  "prompt_injection_eval",
  "rollback_verification",
] as const;

export type SecurityEvidenceDimension =
  (typeof SECURITY_EVIDENCE_DIMENSIONS)[number];

export const OPERATIONS_CAPACITY_DIMENSIONS = [
  "participant_support",
  "human_review",
  "incident_response",
  "safeguarding_escalation",
  "outage_handling",
] as const;

export type OperationsCapacityDimension =
  (typeof OPERATIONS_CAPACITY_DIMENSIONS)[number];

/** Evidence presence — never invent completed evidence. */
export type EvidencePresence = {
  present: boolean;
  /** Free-text reference (doc path, ticket, run id). Null when absent. */
  ref: string | null;
  /** ISO timestamp when evidence was recorded. Null when absent. */
  recordedAt: string | null;
  notes?: string;
};

export type AccessibilityEvidenceBundle = Record<
  AccessibilityEvidenceDimension,
  EvidencePresence
>;

export type SecurityEvidenceBundle = Record<
  SecurityEvidenceDimension,
  EvidencePresence
>;

export type OperationsCapacityBundle = Record<
  OperationsCapacityDimension,
  EvidencePresence & {
    /** Named capacity holder — required when present. */
    namedOwner: string | null;
  }
>;

export type ReleaseGateEvidence = {
  owner: EvidencePresence & { namedOwner: string | null };
  purpose: EvidencePresence;
  authorityCeiling: EvidencePresence & {
    ceiling: AuthorityCeiling | null;
  };
  privacyClassification: EvidencePresence & {
    dataClasses: DataClass[];
  };
  consentScopes: EvidencePresence & { scopes: string[] };
  humanReviewPath: EvidencePresence;
  featureFlag: EvidencePresence & { flagName: string | null };
  killSwitch: EvidencePresence & { killSwitchKey: string | null };
  evaluationSuite: EvidencePresence & { suiteId: string | null };
  accessibility: AccessibilityEvidenceBundle;
  security: SecurityEvidenceBundle;
  rollbackPlan: EvidencePresence;
  operationalOwner: EvidencePresence & { namedOwner: string | null };
  supportProcess: EvidencePresence;
  incidentProcess: EvidencePresence;
  knownLimitations: EvidencePresence & { limitations: string[] };
  operationsCapacity: OperationsCapacityBundle;
};

/**
 * MapAbleReleaseManifest — code-defined release metadata.
 * approvedBy / approvedAt / review refs stay null until real approval occurs.
 */
export type MapAbleReleaseManifest = {
  capabilityKey: string;
  releaseState: ReleaseState;
  version: string;
  allowedCohorts: string[];
  domains: string[];
  requiredFlags: string[];
  requiredEvals: string[];
  requiredHumanOperations: string[];
  knownLimitations: string[];
  privacyReviewRef: string | null;
  accessibilityReviewRef: string | null;
  securityReviewRef: string | null;
  rollbackPlanRef: string | null;
  owner: string;
  /** Null until a real human approval is recorded. Never fabricate. */
  approvedBy: string | null;
  /** ISO timestamp; null when not approved. */
  approvedAt: string | null;
  /** Optional ISO expiry for time-bounded pilot approvals. */
  expiresAt: string | null;
  evidence: ReleaseGateEvidence;
  /**
   * Related capability maturity from the registry taxonomy (informational).
   * Release state does not auto-sync from maturity on merge.
   */
  relatedCapabilityMaturity: CapabilityMaturity;
};

export type GateFailure = {
  code: string;
  gate:
    | "identity"
    | "privacy"
    | "human_review"
    | "flags"
    | "evaluation"
    | "accessibility"
    | "security"
    | "rollback"
    | "operations"
    | "approval"
    | "claims"
    | "cohort"
    | "suspension"
    | "governance_flag";
  message: string;
};

export type ReadinessAssessment = {
  capabilityKey: string;
  releaseState: ReleaseState;
  verdict: ReadinessVerdict;
  failures: GateFailure[];
  checkedAt: string;
  /** True only when MAPABLE_RELEASE_GOVERNANCE_ENABLED is on. */
  governanceEnforcementActive: boolean;
};

export type PilotCohortMembership = {
  cohortId: string;
  tenantId: string;
  participantId: string;
  capabilityKey: string;
  grantedAt: string;
  grantedBy: string;
  revokedAt: string | null;
  revokedBy: string | null;
  /** Server-side audit trail note. */
  auditNote: string;
};

export type CohortAccessDecision = {
  allowed: boolean;
  reason: string;
  membership: PilotCohortMembership | null;
};

/** Phrases experimental releases must never use in public claims. */
export const PROHIBITED_EXPERIMENTAL_CLAIM_PHRASES = [
  "production proven",
  "production-proven",
  "ndia approved",
  "ndia-approved",
  "ndis registered",
  "ndis-registered",
  "clinically validated",
  "clinically-validated",
  "certified",
  "fully autonomous",
  "fully-autonomous",
] as const;

export type PublicClaimCheckInput = {
  capabilityKey: string;
  releaseState: ReleaseState;
  claimText: string;
  /** When true, claim is presented on a public / marketing surface. */
  publicSurface: boolean;
};
