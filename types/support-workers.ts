/** Deterministic support-worker matching domain types (no Prisma leakage). */

export type HardFilterCode =
  | "NOT_VERIFIED"
  | "SCREENING_INVALID"
  | "UNSUPPORTED_SERVICE_TYPE"
  | "NOT_AVAILABLE"
  | "PARTICIPANT_BLOCKED"
  | "MISSING_CAPABILITY"
  | "BSP_TRAINING_REQUIRED"
  | "OUT_OF_REGION";

export type ScoreReasonCode =
  | "QUALIFICATION_FIT"
  | "AVAILABILITY_FIT"
  | "LOCATION_FIT"
  | "PREFERENCE_FIT"
  | "CONTINUITY"
  | "COMMUNICATION_FIT"
  | "RELIABILITY_FIT";

export type MatchWarningCode =
  | "UNRESOLVED_INCIDENT"
  | "HIGH_CANCELLATION"
  | "EXPIRED_CHECK"
  | "MISSING_TRAINING"
  | "PREVIOUSLY_REJECTED"
  | "LOW_CONFIDENCE";

export type MatchConfidence = "high" | "medium" | "low";

export type SupportType =
  | "personal_care"
  | "domestic_assistance"
  | "community_access"
  | "appointment_support"
  | "employment_support"
  | "meal_preparation"
  | "therapy_assistance"
  | "skill_building"
  | "overnight_support"
  | "other";

export type SupportWorker = {
  id: string;
  displayName: string;
  profileSummary?: string | null;
  organisationId: string;
  organisationName: string;
  serviceTypes: string[];
  languages: string[];
  communicationModes: string[];
  capabilities: string[];
  verificationStatus: string;
  workerScreeningStatus: string;
  wwccStatus: string;
  firstAidStatus: string;
  badges: WorkerSafetyBadge[];
};

export type WorkerSafetyBadge = {
  code: string;
  label: string;
  status: "ok" | "caution" | "unknown";
};

export type ParticipantSupportProfile = {
  participantId: string;
  preferredWorkerIds: string[];
  blockedWorkerIds: string[];
  hiddenWorkerIds: string[];
  preferredGender?: string | null;
  preferredLanguages: string[];
  preferredCommunicationModes: string[];
  maxDistanceKm: number;
  continuityPreferred: boolean;
  requiresBehaviourSupportPlan: boolean;
  communicationPreferences: unknown[];
};

export type SupportRequest = {
  supportType: SupportType;
  startsAt: string;
  endsAt: string;
  lat?: number;
  lng?: number;
  requiredCapabilities?: string[];
  communicationModes?: string[];
  languages?: string[];
  preferredGender?: string;
  maxDistanceKm?: number;
  requiresBehaviourSupportPlan?: boolean;
  excludeWorkerIds?: string[];
  limit?: number;
};

export type MatchReason = {
  code: ScoreReasonCode;
  label: string;
  plainLanguageExplanation: string;
  weight?: number;
  score?: number;
};

export type MatchWarning = {
  code: MatchWarningCode;
  severity: "info" | "caution";
  plainLanguageExplanation: string;
  iconLabel: string;
};

export type WorkerMatch = {
  worker: SupportWorker;
  score: number;
  confidence: MatchConfidence;
  reasons: MatchReason[];
  warnings: MatchWarning[];
  rank: number;
};

export type WorkerMatchEventType =
  | "search"
  | "match_run"
  | "save_preferred"
  | "hide"
  | "reject"
  | "request_more"
  | "select";

export const SCORE_WEIGHTS: Record<ScoreReasonCode, number> = {
  QUALIFICATION_FIT: 25,
  AVAILABILITY_FIT: 20,
  LOCATION_FIT: 15,
  PREFERENCE_FIT: 15,
  CONTINUITY: 10,
  COMMUNICATION_FIT: 10,
  RELIABILITY_FIT: 5,
};

export const RISK_PENALTIES: Record<MatchWarningCode, number> = {
  UNRESOLVED_INCIDENT: 15,
  HIGH_CANCELLATION: 10,
  EXPIRED_CHECK: 20,
  MISSING_TRAINING: 10,
  PREVIOUSLY_REJECTED: 25,
  LOW_CONFIDENCE: 0,
};
