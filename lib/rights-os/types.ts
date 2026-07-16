export type RightsDataOperation =
  | "read"
  | "disclose"
  | "create_derived_data"
  | "store"
  | "update"
  | "export"
  | "contact";

export type RightsPolicyOutcome =
  | "allow"
  | "allow_with_duties"
  | "deny"
  | "participant_review_required"
  | "human_review_required";

export type RightsDuty = {
  code: string;
  description: string;
};

export type RightsProhibition = {
  code: string;
  description: string;
};

export type RightsDecisionReason = {
  code: string;
  message: string;
  field?: string;
};

export type RightsDataUseRequestInput = {
  requestId: string;
  requester: {
    actorId: string;
    actorType: string;
    organisationId?: string;
    role?: string;
  };
  recipient: {
    actorId?: string;
    organisationId?: string;
    serviceId?: string;
    displayName: string;
  };
  subjectUserId: string;
  purposeCode: string;
  requestedOperations: readonly RightsDataOperation[];
  requestedFields: string[];
  sourceAssets: string[];
  context: {
    missionId?: string;
    proposalId?: string;
    bookingId?: string;
    employmentId?: string;
    visitPlanId?: string;
    emergencyContextId?: string;
  };
  requestedAt: string;
  requestedUntil?: string;
  onwardSharingRequested: boolean;
  retentionRequested?: string;
};

export type RightsPolicyDecisionResult = {
  decisionId: string;
  requestId: string;
  outcome: RightsPolicyOutcome;
  allowedFields: string[];
  deniedFields: string[];
  allowedOperations: RightsDataOperation[];
  deniedOperations: RightsDataOperation[];
  duties: RightsDuty[];
  prohibitions: RightsProhibition[];
  requiredApprovals: string[];
  requiredAuthorityRecords: string[];
  expiresAt?: string;
  reasons: RightsDecisionReason[];
  policyVersion: string;
  evaluatedAt: string;
};

export type PurposeDefinition = {
  code: string;
  description: string;
  legalBasis?: string;
  allowedRequesters: string[];
  allowedRecipients: string[];
  allowedFields: string[];
  prohibitedFields: string[];
  allowedOperations: RightsDataOperation[];
  defaultDurationHours?: number;
  defaultRetention?: string;
  onwardSharing?: string;
  participantReviewRequired?: boolean;
  humanReviewRequired?: boolean;
  requiredDuties?: string[];
  affectedProgrammes?: string[];
};

export type FieldDefinition = {
  path: string;
  displayName: string;
  sensitivity: string;
  domain: string;
  description?: string;
};

export type FieldCompileResult = {
  required: string[];
  optional: string[];
  prohibited: string[];
  reasons: RightsDecisionReason[];
  lowerDisclosureAlternative?: string[];
  humanReviewRequired: boolean;
};
