/**
 * Release governance public API (Prompt 12).
 * Gates only — does not enable pilots or production releases.
 */

export {
  ACCESSIBILITY_EVIDENCE_DIMENSIONS,
  OPERATIONS_CAPACITY_DIMENSIONS,
  PROHIBITED_EXPERIMENTAL_CLAIM_PHRASES,
  READINESS_VERDICTS,
  RELEASE_STATES,
  SECURITY_EVIDENCE_DIMENSIONS,
} from "./types";
export type {
  AccessibilityEvidenceBundle, AccessibilityEvidenceDimension, CohortAccessDecision, EvidencePresence, GateFailure, MapAbleReleaseManifest, OperationsCapacityBundle, OperationsCapacityDimension, PilotCohortMembership, PublicClaimCheckInput, ReadinessAssessment, ReadinessVerdict, ReleaseGateEvidence, ReleaseState, SecurityEvidenceBundle, SecurityEvidenceDimension,
} from "./types";

export {
  ALLOWED_RELEASE_TRANSITIONS,
  isReleaseState, isPilotEligibleState, isProductionClaimEligibleState, isTerminalReleaseState, suggestedReleaseStateFromMaturity, canTransitionReleaseState,
} from "./states";

export {
  absentEvidence, presentEvidence, emptyAccessibilityEvidence, emptySecurityEvidence, emptyOperationsCapacity, emptyReleaseGateEvidence, isEvidencePresent,
} from "./evidence";

export {
  assessReleaseReadiness, isReadyForHumanReview,
} from "./readiness";

export {
  resetPilotCohortStore, listPilotCohortMemberships, grantPilotCohortMembership, revokePilotCohortMembership, assertCohortAccess,
} from "./cohort";

export {
  evaluatePublicClaim, assertPublicClaimAllowed,
} from "./claims";
export type { PublicClaimCheckResult } from "./claims";

export {
  RELEASE_MANIFESTS,
  listReleaseManifests, getReleaseManifest, requireReleaseManifest,
} from "./manifests";

export {
  releaseStateSchema, readinessVerdictSchema, evidencePresenceSchema, releaseGateEvidenceSchema, mapAbleReleaseManifestSchema, pilotCohortMembershipSchema,
} from "./schemas";
