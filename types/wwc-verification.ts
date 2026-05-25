export type WwcJurisdiction =
  | "NSW"
  | "VIC"
  | "QLD"
  | "WA"
  | "SA"
  | "TAS"
  | "ACT"
  | "NT";

export type WwcCheckType =
  | "working_with_children_check"
  | "blue_card"
  | "working_with_vulnerable_people"
  | "ochre_card";

export type WwcVerificationStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "needs_more_information"
  | "not_required"
  | "expired"
  | "suspended"
  | "barred";

export type WwcVerificationEventType =
  | "submitted"
  | "evidence_attached"
  | "review_started"
  | "approved"
  | "rejected"
  | "needs_more_information"
  | "not_required"
  | "expired"
  | "suspended"
  | "barred"
  | "expiry_updated"
  | "next_check_scheduled"
  | "eligibility_recalculated"
  | "note_added";

export type WwcVerification = {
  id: string;
  workerProfileId: string;
  organisationId: string;
  jurisdiction: WwcJurisdiction;
  checkType: WwcCheckType;
  checkNumber: string;
  legalFirstName: string;
  legalLastName: string;
  dateOfBirth: string | null;
  status: WwcVerificationStatus;
  verifiedName: string | null;
  verifiedResult: string | null;
  verifiedPayloadJson: Record<string, unknown> | null;
  evidenceDocumentId: string | null;
  checkedAt: string | null;
  expiresAt: string | null;
  nextCheckAt: string | null;
  reviewedById: string | null;
  reviewNotes: string | null;
  consentConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WwcVerificationEvent = {
  id: string;
  verificationId: string;
  eventType: WwcVerificationEventType;
  actorUserId: string | null;
  payloadJson: Record<string, unknown> | null;
  createdAt: string;
};

export type WwcBookingContext = {
  participantUnder18?: boolean;
  mapableKids?: boolean;
  schoolTransport?: boolean;
  paediatricTherapy?: boolean;
  youthEmploymentSupport?: boolean;
  safeguardingRestrictionActive?: boolean;
};

export type WwcEligibilityResult = {
  required: boolean;
  allowed: boolean;
  reasons: string[];
  missingRequirements: string[];
  activeVerificationStatus: WwcVerificationStatus | null;
  publicBadgeLabel: string;
};

export type WwcVerificationInput = {
  jurisdiction: WwcJurisdiction;
  checkType: WwcCheckType;
  checkNumber: string;
  legalFirstName: string;
  legalLastName: string;
  dateOfBirth?: string | null;
  expiresAt?: string | null;
  evidenceDocumentId?: string | null;
  consentConfirmed: boolean;
};

export type WwcVerificationResult = {
  success: boolean;
  verifiedName: string | null;
  verifiedResult: string | null;
  message: string | null;
  payload: Record<string, unknown> | null;
  checkedAt: string;
};

export type WwcAdminDecision =
  | "approve"
  | "reject"
  | "needs_more_information"
  | "not_required"
  | "expired"
  | "suspended"
  | "barred";

export const WWC_JURISDICTIONS: WwcJurisdiction[] = [
  "NSW",
  "VIC",
  "QLD",
  "WA",
  "SA",
  "TAS",
  "ACT",
  "NT",
];

export const WWC_CHECK_TYPES_BY_JURISDICTION: Record<
  WwcJurisdiction,
  WwcCheckType[]
> = {
  NSW: ["working_with_children_check"],
  VIC: ["working_with_children_check"],
  QLD: ["blue_card"],
  WA: ["working_with_children_check"],
  SA: ["working_with_children_check"],
  TAS: ["working_with_vulnerable_people"],
  ACT: ["working_with_vulnerable_people"],
  NT: ["ochre_card"],
};

export const WWC_STATUS_BLOCKS_MATCHING: WwcVerificationStatus[] = [
  "rejected",
  "expired",
  "suspended",
  "barred",
  "pending_review",
  "needs_more_information",
  "draft",
];

export const WWC_STATUS_ALLOWS_CHILD_SUPPORT: WwcVerificationStatus[] = [
  "approved",
  "not_required",
];
