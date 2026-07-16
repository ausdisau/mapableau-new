/** Shared ContinuityOS domain types (runtime + API contracts). */

export type LifeEventCategory =
  | "EDUCATION"
  | "EMPLOYMENT"
  | "HOME_AND_COMMUNITY"
  | "HEALTH_AND_SUPPORT"
  | "FAMILY_AND_IDENTITY"
  | "SCHEME_AND_SERVICE";

export type ContinuityMissionStatus =
  | "draft"
  | "planning"
  | "awaiting_participant_input"
  | "awaiting_external_information"
  | "ready"
  | "in_progress"
  | "disrupted"
  | "recovery_required"
  | "recovering"
  | "partially_recovered"
  | "paused"
  | "completed"
  | "cancelled"
  | "stopped"
  | "human_review_required";

export type ContinuityHorizon =
  | "immediate"
  | "short_term"
  | "medium_term"
  | "long_term";

export type DependencyState =
  | "unknown"
  | "unconfirmed"
  | "confirmed"
  | "stale"
  | "failed"
  | "restored"
  | "optional_absent";

export type FailureClass =
  | "AVAILABILITY"
  | "ACCESSIBILITY"
  | "TIMING"
  | "COMMUNICATION"
  | "HANDOFF"
  | "QUALITY_AND_SAFETY"
  | "FINANCIAL"
  | "DATA_AND_AUTHORITY"
  | "ENVIRONMENTAL";

export type FailureSeverity =
  | "informational"
  | "attention"
  | "major"
  | "critical"
  | "human_safety_review_required";

export type AvailabilityState =
  | "verified_available"
  | "available_with_conditions"
  | "requires_confirmation"
  | "unknown"
  | "blocked"
  | "human_review_required";

export type RecoveryOutcomeState =
  | "not_started"
  | "pending"
  | "partially_restored"
  | "restored_with_conditions"
  | "restored"
  | "alternative_goal_completed"
  | "not_restored"
  | "cancelled_by_participant"
  | "human_review_required"
  | "outcome_unknown";

export type HandoffState =
  | "draft"
  | "prepared"
  | "participant_review"
  | "sent"
  | "received"
  | "accepted"
  | "partially_accepted"
  | "rejected"
  | "expired"
  | "withdrawn"
  | "completed"
  | "failed"
  | "human_review_required";

export type MilestoneStatus =
  | "pending"
  | "ready"
  | "blocked"
  | "completed"
  | "expired"
  | "cancelled"
  | "unknown";

export interface ResponsibilityMap {
  serviceProvider?: string;
  contractingOrganisation?: string;
  workerOrOperator?: string;
  mapAbleRole: string;
  participantRole: string;
  supporterRole?: string;
  decisionAuthority: string;
  complaintRoute: string;
  cancellationResponsibility?: string;
  financialResponsibility?: string;
  recoveryResponsibility: string;
}

export interface LifeEventDependencyNode {
  id: string;
  nodeType: string;
  label: string;
  state: DependencyState;
  required: boolean;
  owner: string;
  responsibility: ResponsibilityMap;
  evidence?: string;
  freshness?: string;
  alternativeIds: string[];
  failureImpact?: string;
  reviewDate?: string;
  unknownReason?: string;
  source: string;
}

export interface LifeEventDependencyEdge {
  id: string;
  fromId: string;
  toId: string;
  edgeType: string;
  label?: string;
}

export interface MilestoneTemplate {
  key: string;
  label: string;
  horizon: ContinuityHorizon;
  ownerRole: string;
  requiredDependencyKeys: string[];
}

export interface DependencyTemplate {
  key: string;
  label: string;
  nodeType: string;
  required: boolean;
  ownerRole: string;
  responsibility: ResponsibilityMap;
  failureImpact?: string;
  singlePointOfFailureHint?: boolean;
}

export interface LifeEventTypeDefinition {
  typeKey: string;
  category: LifeEventCategory;
  version: string;
  plainLanguageDescription: string;
  domainsInvolved: string[];
  milestones: MilestoneTemplate[];
  dependencies: DependencyTemplate[];
  commonDocuments: string[];
  commonHandoffs: string[];
  accessibilityBarriers: string[];
  humanRoles: string[];
  policySourceIds: string[];
  requiredWarnings: string[];
  prohibitedAutomatedDecisions: string[];
  reviewOwner: string;
  supersededBy?: string | null;
}

export interface ContinuityPreferenceSet {
  preserveOriginalAppointment?: boolean;
  avoidUnfamiliarWorkers?: boolean;
  avoidStaffDependentRoutes?: boolean;
  prioritiseHighestConfidence?: boolean;
  minimiseAdditionalDisclosure?: boolean;
  minimiseAddedCost?: boolean;
  prioritiseFastestRecovery?: boolean;
  preferHumanCoordinator?: boolean;
  contactSupporterOnlyAfterAsking?: boolean;
  doNotReplaceProviderAutomatically?: boolean;
  useWrittenCommunication?: boolean;
  doNotCallUnlessUrgent?: boolean;
}

export interface RecoveryOptionView {
  id: string;
  title: string;
  summary: string;
  horizon: ContinuityHorizon;
  availability: AvailabilityState;
  hardRequirementsMet: boolean;
  excludedReason?: string;
  remainingUnknowns: string[];
  requiredDisclosure: string[];
  peopleInvolved: string[];
  timingNotes?: string;
  additionalTravel?: string;
  knownCost?: string;
  estimatedCostSource?: string;
  expectedPayer?: string;
  preferenceMatch: string[];
  preferenceConflicts: string[];
  approvalsRequired: string[];
  fallback?: string;
  expiresAt?: string;
  playbookKey?: string;
}

export const CRITICAL_VISIBLE_TERMS = [
  "failed",
  "unknown",
  "replacement",
  "cost",
  "approve",
  "decline",
  "cancel",
  "contact",
  "complaint",
  "stop",
  "emergency",
] as const;
