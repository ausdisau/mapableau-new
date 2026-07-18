/**
 * Supported Decision Studio contracts.
 * AI may explain/compare; must never select or execute a decision.
 */

export const DECISION_TYPES = [
  "worker_replacement",
  "provider_change",
  "transport_quote",
  "vehicle_change",
  "service_agreement_amendment",
  "recurring_schedule_change",
  "equipment_repair_vs_replacement",
  "temporary_equipment",
  "venue_route_alternative",
  "consent_request",
  "information_sharing_request",
  "home_and_living_option",
  "navigator_selection",
] as const;

export type DecisionType = (typeof DECISION_TYPES)[number];

export const DECISION_STATES = [
  "draft",
  "information_gathering",
  "participant_review",
  "supporter_review_optional",
  "questions_pending",
  "ready_for_decision",
  "participant_selected",
  "confirmation_required",
  "confirmed",
  "reversed",
  "expired",
  "withdrawn",
  "disputed",
] as const;

export type DecisionState = (typeof DECISION_STATES)[number];

export type DecisionCase = {
  id: string;
  participantId: string;
  tenantId: string;
  decisionType: DecisionType;
  initiatingActorId: string;
  initiatingActorRole: "participant" | "worker" | "provider" | "system";
  reason: string;
  deadlineIso: string | null;
  state: DecisionState;
  reversibleUntilIso: string | null;
  humanOwnerId: string | null;
  /** Care / mission references — not copied dossiers. */
  sourceRefs: { domain: string; recordId: string }[];
  createdAtIso: string;
  updatedAtIso: string;
};

export type DecisionOption = {
  id: string;
  decisionCaseId: string;
  label: string;
  responsibleOrganisationId: string | null;
  priceOrFinancialEffect: string | null;
  timingEffect: string | null;
  accessEffect: string | null;
  communicationEffect: string | null;
  serviceEffect: string | null;
  transportEffect: string | null;
  equipmentEffect: string | null;
  evidenceRefs: string[];
  unknowns: string[];
  conflicts: string[];
  commercialInterest: string | null;
  recommendationSource: "none" | "participant_criteria" | "provider" | "system_heuristic";
  /** Never a default consequential selection. */
  isDefault: false;
  sortIndex: number;
};

export type DecisionComparison = {
  decisionCaseId: string;
  whatRemainsTheSame: string[];
  whatChanges: string[];
  hardRequirementsPreserved: string[];
  hardRequirementsNotConfirmed: string[];
  preferencesPreserved: string[];
  newUnknowns: string[];
  newRisks: string[];
  participantQuestions: string[];
  humanReviewRequired: boolean;
};

export type DecisionSupportSession = {
  id: string;
  decisionCaseId: string;
  participantId: string;
  supporterId: string;
  /** Explicit authority — relationship alone is never enough. */
  supporterAuthority:
    | "none"
    | "assist_only"
    | "discuss"
    | "co_decide_with_participant";
  privateParticipantNotes: string | null;
  sharedNotes: string | null;
  questions: string[];
  expiresAtIso: string;
};

export type DecisionReceipt = {
  id: string;
  decisionCaseId: string;
  optionIdsShown: string[];
  evidenceVersions: string[];
  conflictsDisclosed: string[];
  supporterInvolved: boolean;
  participantSelectedOptionId: string | null;
  confirmationAtIso: string | null;
  coolingOffUntilIso: string | null;
  reversedAtIso: string | null;
  finalAction: "none" | "confirmed" | "reversed" | "withdrawn" | "expired";
  correctionHistory: { atIso: string; note: string }[];
  /** Execution is always external — studio never books/cancels/assigns. */
  executionDelegated: true;
};
