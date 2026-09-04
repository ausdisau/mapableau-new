import type { DataClass } from "@/lib/ai/platform/types/classification";

export const GUARDIAN_POLICY_VERSION = "guardian-policy-v0.2.0" as const;

export const PROCESSING_SENSITIVITIES = [
  "D0_PUBLIC",
  "D1_INTERNAL",
  "D2_PERSONAL",
  "D3_SENSITIVE",
  "D4_RESTRICTED",
] as const;

export type ProcessingSensitivity = (typeof PROCESSING_SENSITIVITIES)[number];

export const PROCESSING_ZONES = [
  "DEVICE_EDGE",
  "MAPABLE_PRIVATE",
  "APPROVED_EXTERNAL",
] as const;

export type ProcessingZone = (typeof PROCESSING_ZONES)[number];

export const GUARDIAN_DECISION_TYPES = [
  "ALLOW",
  "ALLOW_WITH_CONDITIONS",
  "REDACT_BEFORE_PROCESSING",
  "REQUIRE_PARTICIPANT_CONFIRMATION",
  "ROUTE_TO_HUMAN_REVIEW",
  "ROUTE_TO_COMPLAINTS",
  "ROUTE_TO_INCIDENT_TRIAGE",
  "DENY_DATA_DISCLOSURE",
  "DENY_PROHIBITED_ACTION",
  "SECURITY_QUARANTINE",
] as const;

export type GuardianDecisionType = (typeof GUARDIAN_DECISION_TYPES)[number];

/**
 * Safeguarding / care signal taxonomy — inference only.
 * Never encode abuse_detected / REPORTABLE / CAPACITY_LACKING as model outputs.
 */
export const POSSIBLE_SIGNAL_TYPES = [
  "possible_coercion",
  "possible_financial_exploitation",
  "possible_neglect",
  "possible_physical_abuse",
  "possible_sexual_misconduct",
  "possible_boundary_violation",
  "possible_grooming",
  "possible_privacy_breach",
  "possible_retaliation",
  "possible_unapproved_task_expansion",
  "possible_worker_credential_mismatch",
  "possible_restrictive_practice",
  "possible_participant_voice_suppression",
  "possible_delegate_overreach",
  "possible_unsafe_transport_support",
  "possible_service_continuity_risk",
  "possible_prompt_injection",
  "possible_pii_detected",
  "possible_content_safety",
] as const;

export type PossibleSignalType = (typeof POSSIBLE_SIGNAL_TYPES)[number];

export type GuardianModelSignal = {
  signalId: string;
  signalType: string;
  score?: number;
  capabilityKey: string;
  modelIdentifier?: string;
  modelVersion?: string;
  /** Models always emit model_inference — never confirmed_fact. */
  provenance: "model_inference";
  evidenceRefs?: string[];
  evidenceSpans?: Array<{
    start: number;
    end: number;
    label: string;
  }>;
  limitations?: string[];
  generatedAt: string;
};

export type GuardianExplanation = {
  /** Participant-safe title — prefer "Why MapAble handled this this way". */
  title: string;
  plainLanguage: string;
  easyRead?: string;
  nextSteps: string[];
  humanSupportAvailable: boolean;
  nonAiPathAvailable: boolean;
};

export type GuardianDecision = {
  decision: GuardianDecisionType;
  reasonCodes: string[];
  policyVersion: string;
  purpose: string;
  dataClasses: DataClass[];
  sensitivity: ProcessingSensitivity;
  processingZone?: ProcessingZone;
  processorId?: string;
  modelSignals: GuardianModelSignal[];
  authorityDecisionId?: string;
  consentReceiptIds?: string[];
  participantConfirmationRequired: boolean;
  humanReviewRequired: boolean;
  /** Human must assess reportability — never an AI determination. */
  requiresHumanReportabilityAssessment?: boolean;
  complaintId?: string;
  incidentId?: string;
  explanation: GuardianExplanation;
  auditEventId?: string;
  /** Explicitly false when safeguarding path engaged. */
  aiMayDecideReportability?: false;
  aiMaySubstantiateAllegation?: false;
  aiMayAuthoriseRestrictivePractice?: false;
  aiMayCloseIncidentOrComplaint?: false;
};

export type GuardianEvaluateRequest = {
  purpose: string;
  participantId?: string;
  tenantId?: string;
  actorId: string;
  actorTenantId?: string;
  capabilityKey?: string;
  dataRefs?: string[];
  dataClasses: DataClass[];
  structuredPayload?: Record<string, unknown>;
  requestedOperation?: string;
  consentScopesPresent?: string[];
  authorityGranted?: boolean;
  authorityDecisionId?: string;
  consentReceiptIds?: string[];
  minimumNecessaryFields?: string[];
  /** Ignored / rejected — callers cannot bypass routing. */
  useCloudModel?: boolean;
  objectiveText?: string;
  privateInferenceAvailable?: boolean;
  deviceEdgeAvailable?: boolean;
  jurisdiction?: string;
};

export type GuardianProcessingContext = {
  actorId: string;
  tenantId?: string;
  participantId?: string;
  purpose: string;
  dataClasses: DataClass[];
  sensitivity: ProcessingSensitivity;
  consentScopesPresent: string[];
  authorityGranted: boolean;
  capabilityKey?: string;
  privateInferenceAvailable: boolean;
  deviceEdgeAvailable: boolean;
  jurisdiction?: string;
};
