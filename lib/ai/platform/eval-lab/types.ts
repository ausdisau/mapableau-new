/**
 * Nerve Centre Eval Lab types.
 * Synthetic simulation only — never production participant data or writes.
 */

export const HARD_SAFETY_DIMENSIONS = [
  "authority_preservation",
  "consent_enforcement",
  "data_minimisation",
  "evidence_provenance",
  "uncertainty_honesty",
  "matching_fairness",
  "recovery_authority",
  "replay_protection",
  "connector_misuse",
  "prompt_injection_resistance",
  "human_escalation",
  "kill_switch_honour",
  "non_ai_fallback",
  "tenant_isolation",
  "production_write_ban",
  "synthetic_data_only",
] as const;

export const QUALITY_METRIC_DIMENSIONS = [
  "mission_accuracy",
  "accessibility_clarity",
  "plain_language",
  "latency",
  "cost",
  "hallucination",
  "evidence_attribution",
  "instruction_hierarchy",
  "bias",
  "tool_selection",
] as const;

export type HardSafetyDimension = (typeof HARD_SAFETY_DIMENSIONS)[number];
export type QualityMetricDimension = (typeof QUALITY_METRIC_DIMENSIONS)[number];
export type EvalLabDimension = HardSafetyDimension | QualityMetricDimension;

export const AGENCY_METRICS = [
  "participant_decision_preserved",
  "rejection_honoured",
  "manual_path_works",
  "goal_not_silently_changed",
  "consent_not_inferred",
  "unknown_remains_unknown",
  "human_only_path_remains_human_only",
] as const;

export type AgencyMetric = (typeof AGENCY_METRICS)[number];

export type AccessRequirementKind =
  | "physical"
  | "sensory"
  | "cognitive"
  | "psychosocial"
  | "communication_aac"
  | "multiple";

export type SyntheticAccessRequirement = {
  kind: AccessRequirementKind;
  functionalNeed: string;
  supports?: string[];
};

export type SyntheticPersona = {
  id: string;
  seed: number;
  label: string;
  region: "metro" | "regional" | "remote";
  accessRequirements: SyntheticAccessRequirement[];
  communicationPreferences: string[];
  consentScopes: string[];
  approvedGoals: string[];
  rejectedOptions: string[];
  delegateBoundary?: {
    delegateId: string;
    mayDecide: string[];
    mayNotDecide: string[];
  };
};

export type SyntheticMissionKind =
  | "care_and_transport"
  | "employment"
  | "access_barrier"
  | "service_outage"
  | "conflicting_evidence"
  | "delegate_boundary"
  | "regional_remote"
  | "continuity_recovery";

export type SyntheticMission = {
  id: string;
  personaId: string;
  kind: SyntheticMissionKind;
  objective: string;
  domains: Array<"core" | "care" | "transport" | "jobs" | "access">;
  requestedUseOfAccessibilityProfile?: boolean;
  profileConsentGranted?: boolean;
};

export type AdversarialKind =
  | "prompt_injection_provider_profile"
  | "malicious_document_instructions"
  | "forged_approval"
  | "replayed_nonce"
  | "changed_payload"
  | "cross_tenant_id"
  | "revoked_consent"
  | "fake_provider_cancellation"
  | "stale_accessibility_claim"
  | "false_model_certainty"
  | "tool_unavailable"
  | "model_unavailable"
  | "attempted_worker_auto_assignment"
  | "attempted_transport_confirmation"
  | "attempted_employer_disclosure"
  | "attempted_safeguarding_conclusion";

export type EvalLabAssertionKind = "hard" | "quality";

export type EvalLabAssertion = {
  id: string;
  dimension: EvalLabDimension;
  kind: EvalLabAssertionKind;
  description: string;
  pass: boolean;
  detail?: string;
};

export type EvalLabTraceEvent = {
  at: string;
  type: string;
  module:
    | "agents"
    | "missions"
    | "actions"
    | "recovery"
    | "safeguarding"
    | "policies"
    | "evaluations"
    | "synthetic"
    | "lab";
  payload: Record<string, unknown>;
};

export type EvalLabScenario = {
  id: string;
  version: string;
  title: string;
  tags: string[];
  personaId: string;
  missionId: string;
  seed: number;
  virtualClockIso: string;
  adversarial?: AdversarialKind;
  expected: {
    mustPreserveAuthority?: boolean;
    mustHonourRejection?: boolean;
    mustAbstainOrEscalate?: boolean;
    mustBlockOperation?: string;
    mustResistInjection?: boolean;
    mustRejectCrossTenant?: boolean;
    mustHonourRevokedConsent?: boolean;
    mustKeepHumanOnly?: boolean;
    mustLeaveUnknownUnknown?: boolean;
    mustBlockReplay?: boolean;
    mustDetectPayloadChange?: boolean;
    mustBlockForgedApproval?: boolean;
  };
};

export type AgencyMetricSnapshot = Record<
  AgencyMetric,
  { pass: boolean; detail?: string }
>;

export type EvalLabScenarioResult = {
  scenarioId: string;
  passedHard: boolean;
  qualityScore: number;
  assertions: EvalLabAssertion[];
  agency: AgencyMetricSnapshot;
  events: EvalLabTraceEvent[];
  latencyMs: number;
  estimatedCostUsd: number;
  productionWrites: false;
  usedRealParticipantData: false;
};

export type EvalLabRunReport = {
  runId: string;
  startedAt: string;
  finishedAt: string;
  productionWrites: false;
  usedRealParticipantData: false;
  results: EvalLabScenarioResult[];
  hardInvariantFailures: string[];
  qualityFailures: string[];
  byHardDimension: Record<
    HardSafetyDimension,
    { passed: number; failed: number; total: number }
  >;
  byQualityDimension: Record<
    QualityMetricDimension,
    { passed: number; failed: number; total: number }
  >;
  agencySummary: Record<AgencyMetric, { passed: number; failed: number }>;
  legacyEvalSuiteIncluded: boolean;
};
