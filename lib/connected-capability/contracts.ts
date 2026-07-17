/**
 * Shared programme contracts — single definitions for all Connected Capability systems.
 * Consumers import from here; do not redefine per system.
 */

import type { EvidenceClass, EvidenceReference } from "./evidence";
import type { UniversalHandoff } from "./handoff";

export type {
  EvidenceClass,
  EvidenceReference,
  UniversalHandoff,
};

export type CommunicationPassportState =
  | "draft"
  | "participant_confirmed"
  | "active"
  | "temporarily_overridden"
  | "expired"
  | "revoked"
  | "disputed"
  | "human_review_required";

export interface CommunicationRequirement {
  id: string;
  kind:
    | "preferred_method"
    | "aac_method"
    | "written"
    | "spoken"
    | "interpreter"
    | "captioning"
    | "plain_language"
    | "easy_read"
    | "response_time"
    | "one_question_at_a_time"
    | "visual"
    | "audio"
    | "haptic"
    | "supporter_role"
    | "incident_mode"
    | "custom";
  value: string | boolean | number;
  instructions?: string;
  evidenceClass: EvidenceClass;
}

export interface CommunicationRenderingRequest {
  passportId: string;
  participantId: string;
  channel: "screen" | "print" | "audio" | "aura" | "handoff_card";
  presentation:
    | "plain_language"
    | "easy_read"
    | "structured_json"
    | "one_question";
  locale?: string;
  includeFields?: string[];
}

export interface CommunicationRenderingResponse {
  request: CommunicationRenderingRequest;
  blocks: Array<{
    type: "heading" | "paragraph" | "list" | "instruction" | "warning";
    text: string;
    pauseMs?: number;
  }>;
  oneQuestionAtATime: boolean;
  responseTimeMinimumSeconds?: number | null;
  sourceVersion: string;
  isSynthetic?: boolean;
}

export interface CommunicationHandoff extends UniversalHandoff {
  communicationMethod: string;
  passportState: CommunicationPassportState;
}

export interface WorkerReadinessRequest {
  workerProfileId: string;
  organisationId: string;
  purpose: string;
  requiredCompetencies?: string[];
  participantIntroductionRequired?: boolean;
}

export type ReadinessStatus =
  | "ready"
  | "blocked"
  | "unknown"
  | "human_review_required";

export interface WorkerReadinessResult {
  workerProfileId: string;
  organisationId: string;
  status: ReadinessStatus;
  checks: Array<{
    key: string;
    label: string;
    status: "verified" | "current" | "present" | "unknown" | "expired" | "missing" | "not_completed";
    evidenceClass: EvidenceClass;
    detail?: string;
  }>;
  blockers: string[];
  assignmentReadiness: "ready" | "blocked";
  qualityScore: null;
  sourceVersion: string;
  computedAt: string;
  isSynthetic?: boolean;
}

export interface LearningCompletionReference {
  id: string;
  learnerUserId: string;
  courseCode: string;
  courseTitle: string;
  completedAt: string;
  evidenceClass: "course_completion";
  provider: "mapable_academy" | "external_lms" | "provider_academy_bridge";
  expiresAt?: string | null;
  isSynthetic?: boolean;
}

export interface LearningAssessmentReference {
  id: string;
  learnerUserId: string;
  assessmentCode: string;
  passed: boolean;
  evidenceClass: "assessment_passed" | "unknown";
  assessedAt: string;
  isSynthetic?: boolean;
}

export interface CompetencyEvidenceReference {
  id: string;
  workerProfileId: string;
  competencyKey: string;
  evidence: EvidenceReference[];
  competencyProved: boolean;
  expiresAt?: string | null;
  humanReviewRequired: boolean;
}

export interface EquipmentCompatibilityRequest {
  equipmentPassportId: string;
  context: "transport" | "care" | "workplace" | "home";
  questions: string[];
}

export interface EquipmentContinuitySignal {
  equipmentPassportId: string;
  participantId: string;
  batteryStatus?: "unknown" | "charged" | "low" | "critical";
  maintenanceDue?: boolean;
  repairOpen?: boolean;
  transportCompatible?: "unknown" | "yes" | "no" | "needs_review";
  clinicalSuitabilityClaim: null;
  sourceVersion: string;
  isSynthetic?: boolean;
}

export interface MobileCapabilityProfile {
  platform: "ios" | "android" | "web_fallback";
  secureStorage: boolean;
  offlineDatabase: boolean;
  pushNotifications: boolean;
  camera: boolean;
  continuousLocation: false;
  backgroundRecording: false;
}

export interface OfflineMissionPack {
  id: string;
  participantId: string;
  missionRef: string;
  communicationPassportSummary: Record<string, unknown>;
  careAndTransport: Record<string, unknown>;
  equipmentSignals: EquipmentContinuitySignal[];
  issuedAt: string;
  expiresAt: string;
  encryptedPayloadHint: "secure_store_required";
  isSynthetic?: boolean;
}

export interface OutcomeContract {
  id: string;
  participantId: string;
  goalStatement: string;
  indicators: string[];
  serviceEvidenceLinks: string[];
  state: "draft" | "active" | "achieved" | "not_achieved" | "unknown" | "disputed";
  authoredByParticipant: true;
  successScore: null;
  sourceVersion: string;
  isSynthetic?: boolean;
}

export interface OutcomeObservation {
  id: string;
  contractId: string;
  observerRole: "participant" | "supporter" | "provider" | "system";
  statement: string;
  evidenceClass: EvidenceClass;
  observedAt: string;
  conflictsWith?: string[];
}

export interface OutcomeReceipt {
  id: string;
  contractId: string;
  participantId: string;
  participantOutcome: string;
  serviceEvidenceSummary: string[];
  unresolvedItems: string[];
  immutable: true;
  createdAt: string;
  hash: string;
  isSynthetic?: boolean;
}

export interface OperationsAttentionItem {
  id: string;
  organisationId: string;
  kind:
    | "essential_shift_unfilled"
    | "transport_at_risk"
    | "credential_expiring"
    | "competency_unresolved"
    | "equipment_repair_overdue"
    | "incident_deadline"
    | "complaint_response_overdue"
    | "handoff_unaccepted"
    | "invoice_rejected"
    | "outcome_review_due"
    | "recovery_unresolved"
    | "communication_requirement_unacknowledged";
  title: string;
  why: string;
  owner: string;
  ifUnresolved: string;
  relatedEntityType: string;
  relatedEntityId: string;
  participantFieldsExposed: string[];
  freshness: "live" | "delayed" | "synthetic";
  createdAt: string;
}

export interface OperationsProjection {
  organisationId: string;
  generatedAt: string;
  items: OperationsAttentionItem[];
  isReadOnly: true;
  sourceVersion: string;
}

export interface CapacityNeed {
  id: string;
  regionId: string;
  capacityType: string;
  windowStart: string;
  windowEnd: string;
  credentialRequirements: string[];
  accessRequirements: string[];
  state: "open" | "candidate_found" | "closed";
  isSynthetic?: boolean;
}

export interface CapacityCandidate {
  id: string;
  needId: string;
  providerOrganisationId: string;
  state:
    | "candidate_found"
    | "provider_available"
    | "provider_accepted"
    | "participant_approved"
    | "service_confirmed"
    | "service_delivered"
    | "rejected"
    | "expired";
  disclosureMinimised: true;
  automaticAssignment: false;
  isSynthetic?: boolean;
}

export interface CapacityCommitment {
  id: string;
  candidateId: string;
  participantApproved: boolean;
  providerConfirmed: boolean;
  state: "pending" | "committed" | "cancelled";
  automaticCommit: false;
}

export interface PartnerCapability {
  id: string;
  key: string;
  title: string;
  scopes: string[];
  allowsParticipantRecords: false;
  sandboxOnlyDefault: boolean;
}

export interface PartnerContract {
  id: string;
  partnerId: string;
  capabilities: string[];
  purpose: string;
  fieldMinimisation: true;
  unrestrictedData: false;
}

export interface PartnerEvidenceReceipt {
  id: string;
  partnerId: string;
  capabilityKey: string;
  synthetic: boolean;
  receivedAt: string;
}
