import type { AuthorityCeiling } from "@/lib/ai-platform/types/authority";

/** Honest product positioning — use consistently in UI, API, and docs. */
export const PBS_POSITIONING =
  "MapAble Positive Behaviour Support is a controlled-pilot, practitioner-led assessment, drafting, implementation and monitoring workspace." as const;

export const PBS_FORBIDDEN_CLAIMS = [
  "autonomous",
  "clinically validated",
  "Commission-approved",
  "registered behaviour support provider",
  "production-ready",
  "diagnoses behaviour function",
  "approves restrictive practices",
  "authorises restrictive practices",
  "recommends restrictive practices",
] as const;

export const PBS_PLAN_STATUSES = [
  "draft",
  "assessment_in_progress",
  "consultation",
  "practitioner_review",
  "finalised",
  "active",
  "review_due",
  "superseded",
  "archived",
] as const;

export type PbsPlanStatus = (typeof PBS_PLAN_STATUSES)[number];

export const PBS_PLAN_TYPES = ["interim", "comprehensive"] as const;
export type PbsPlanType = (typeof PBS_PLAN_TYPES)[number];

export const PBS_ENGAGEMENT_STATUSES = [
  "draft",
  "active",
  "paused",
  "closed",
  "archived",
] as const;
export type PbsEngagementStatus = (typeof PBS_ENGAGEMENT_STATUSES)[number];

export const PBS_SUITABILITY_STATUSES = [
  "claimed",
  "pending_verification",
  "verified",
  "rejected",
  "expired",
  "revoked",
] as const;
export type PbsSuitabilityStatus = (typeof PBS_SUITABILITY_STATUSES)[number];

export const PBS_QUESTIONNAIRE_SECTIONS = [
  "communication_decision_making",
  "strengths_interests_identity",
  "good_life",
  "routines_relationships_environments",
  "health_pain_sleep_medication_sensory",
  "observable_behaviour_descriptions",
  "frequency_duration_intensity_context",
  "antecedent_behaviour_consequence",
  "environmental_systemic_barriers",
  "proactive_support_preferences",
  "skills_communication_replacement",
  "response_recovery_safety",
  "restrictive_practice_screening",
  "implementation_responsibilities",
  "outcomes_and_review",
] as const;
export type PbsQuestionnaireSection =
  (typeof PBS_QUESTIONNAIRE_SECTIONS)[number];

export const PBS_ANSWER_STATUSES = [
  "answered",
  "skipped",
  "unknown",
  "paused",
  "disagreed",
  "corrected",
] as const;
export type PbsAnswerStatus = (typeof PBS_ANSWER_STATUSES)[number];

export const PBS_RP_CLASSIFICATIONS = [
  "not_restrictive",
  "possible_restrictive",
  "regulated_restrictive",
  "unclassified",
] as const;
export type PbsRpClassification = (typeof PBS_RP_CLASSIFICATIONS)[number];

export const PBS_RP_AUTHORISATION_STATUSES = [
  "not_required",
  "required_missing",
  "pending_external",
  "recorded_external",
  "gap_blocks_activation",
] as const;
export type PbsRpAuthorisationStatus =
  (typeof PBS_RP_AUTHORISATION_STATUSES)[number];

export const PBS_ASSISTANCE_ACTIONS = [
  "identify_unanswered_sections",
  "draft_neutral_follow_up_questions",
  "organise_approved_evidence",
  "prepare_consultation_checklist",
  "create_plain_language_summary",
  "prepare_draft_section_scaffolding",
  "identify_contradictions",
  "map_reviewed_content_to_template",
] as const;
export type PbsAssistanceAction = (typeof PBS_ASSISTANCE_ACTIONS)[number];

export const PBS_PROHIBITED_ASSISTANCE_ACTIONS = [
  "determine_behaviour_function",
  "diagnose",
  "infer_trauma",
  "assess_clinical_readiness",
  "resolve_safeguarding",
  "recommend_restrictive_practice",
  "approve_restrictive_practice",
  "authorise_restrictive_practice",
  "activate_restrictive_practice",
  "finalise_plan",
  "write_canonical_clinical_determination",
] as const;
export type PbsProhibitedAssistanceAction =
  (typeof PBS_PROHIBITED_ASSISTANCE_ACTIONS)[number];

export type PbsAuthorityCeiling = Extract<
  AuthorityCeiling,
  "DRAFT_ONLY" | "SUGGEST_WITH_HUMAN_REVIEW" | "NO_OPERATIONAL_AUTHORITY"
>;

export interface PbsAccessActor {
  userId: string;
  role: string;
  organisationIds: string[];
  isPlatformAdmin: boolean;
}

export type PbsAccessPurpose =
  | "participant_self"
  | "delegate_grant"
  | "assigned_practitioner"
  | "implementing_provider"
  | "admin_governance_metadata"
  | "break_glass";

export interface PbsAccessDecision {
  allowed: boolean;
  purpose: PbsAccessPurpose | "denied";
  reason: string;
  clinicalContentAllowed: boolean;
  fieldScope: "none" | "metadata" | "implementation" | "full";
}

export interface PbsFinalisationChecklist {
  engagementActive: boolean;
  assignedPractitioner: boolean;
  verifiedSuitability: boolean;
  requiredAssessmentSections: boolean;
  consultationEvidence: boolean;
  participantFeedbackOrDocumentedReason: boolean;
  unresolvedConflictAcknowledged: boolean;
  practitionerDeclaration: boolean;
  currentSourceChecklistVersion: boolean;
  restrictivePracticeGatePassed: boolean;
}

export interface PbsAssistanceRequest {
  action: PbsAssistanceAction;
  engagementId: string;
  planId?: string;
  sectionKeys?: string[];
  knownSectionKeys?: string[];
  unansweredSectionKeys?: string[];
  contradictions?: Array<{ left: string; right: string; label: string }>;
  approvedEvidenceKeys?: string[];
}

export interface PbsAssistanceResult {
  authorityCeiling: PbsAuthorityCeiling;
  engineId: string;
  action: PbsAssistanceAction;
  proposals: Array<{
    kind: string;
    text: string;
    sectionKey?: string;
    unresolved?: boolean;
  }>;
  unknowns: string[];
  conflicts: string[];
  provider: "deterministic_local";
  model: "rules-v1";
  promptVersion: string;
  inputHash: string;
  outputHash: string;
  externalModelUsed: false;
}

export interface PbsExternalPayloadField {
  key: string;
  value: string;
  allowlisted: boolean;
}

export interface PbsDeidentifiedPayload {
  placeholders: Record<string, string>;
  fields: PbsExternalPayloadField[];
  freeTextApprovedExact?: string;
  freeTextApprovalId?: string;
}

export const PBS_EXTERNAL_FIELD_ALLOWLIST = [
  "section_key",
  "plan_type",
  "plan_status",
  "observable_behaviour_label",
  "frequency_band",
  "intensity_band",
  "environment_type",
  "strategy_category",
  "review_window_days",
] as const;

export const PBS_EXTERNAL_FORBIDDEN_FIELD_KEYS = [
  "name",
  "dateOfBirth",
  "dob",
  "ndisNumber",
  "address",
  "email",
  "phone",
  "contact",
  "providerName",
  "participantId",
  "organisationId",
  "rawRecord",
] as const;
