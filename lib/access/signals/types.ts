/**
 * Access Signals RAG vocabulary — distinct from AccessCompatibilityState.
 * Never merge RAG semantics with Passport / Accreditation scores.
 */

export type RagStatus = "red" | "amber" | "green" | "unknown";

export type RagApplicability = "applicable" | "not_applicable";

export type RagEvidenceFlag =
  | "disputed"
  | "outdated"
  | "community_reported"
  | "assessor_observed"
  | "verified"
  | "ai_inferred"
  | "unverified_legacy_import"
  | "synthetic";

export type RagOperationalCondition = {
  id: string;
  label: string;
  temporary: boolean;
  /** Outages are separate from permanent barriers. */
  kind: "temporary_outage" | "scheduled_works" | "assistance_available" | "other";
};

export type RagObservation = {
  id: string;
  featureKey: string;
  domain: string;
  value: string | number | boolean;
  observedAt: string;
  flags: RagEvidenceFlag[];
  notes?: string;
};

export type RagFeatureAssessmentInput = {
  featureId: string;
  label: string;
  domain: string;
  applicability: RagApplicability;
  notApplicableReason?: string;
  observations: RagObservation[];
  operationalConditions: RagOperationalCondition[];
  /** Critical unknown blocks route Green (invariant). */
  critical: boolean;
  /** Explicit barrier marker from assessor/network. */
  barrierPresent: boolean;
  /** Documented conditions that allow Amber rather than Red. */
  documentedConditions?: string[];
  /** Verified alternative path ids that may change route conclusion. */
  verifiedAlternativeIds?: string[];
};

export type RagRouteAssessmentInput = {
  routeId: string;
  label: string;
  segmentFeatureIds: string[];
  /** When edges/nodes are incomplete — insufficient evidence. */
  networkComplete: boolean;
};

export type RagEvaluationResult = {
  status: RagStatus;
  applicability: RagApplicability;
  explanation: string;
  evidenceRefs: string[];
  ruleVersion: string;
  unresolvedQuestions: string[];
  operationalConditions: RagOperationalCondition[];
  /** Never averaged across features — per-subject conclusion only. */
  aggregated: false;
  limitations: string[];
};

export type RagShape = "circle" | "triangle" | "square" | "diamond";

export type RagDescriptor = {
  status: RagStatus;
  label: string;
  shape: RagShape;
  shortDescription: string;
  legendDescription: string;
};
