/**
 * Shared types for MapAble strategic wedges.
 * Used by availability graph, access-fit matching, trust, and request tracking.
 */

// ─── Access needs (W2, W3, W10) ───────────────────────────────────────────

export const ACCESS_NEED_IDS = [
  "wheelchairAccess",
  "powerchairAccess",
  "stepFreeEntry",
  "accessibleToilet",
  "lowSensoryEnvironment",
  "auslan",
  "aacFriendly",
  "plainLanguage",
  "homeVisit",
  "telehealth",
  "hoistReady",
  "assistanceAnimalFriendly",
  "culturalLanguagePreference",
  "genderPreferenceForPersonalCare",
  "transportSupportNeeded",
] as const;

export type AccessNeedId = (typeof ACCESS_NEED_IDS)[number];

export type AccessNeedProfile = Partial<Record<AccessNeedId, boolean | string>>;

export const ACCESS_NEED_LABELS: Record<AccessNeedId, string> = {
  wheelchairAccess: "Wheelchair access",
  powerchairAccess: "Powerchair access",
  stepFreeEntry: "Step-free entry",
  accessibleToilet: "Accessible toilet",
  lowSensoryEnvironment: "Low sensory environment",
  auslan: "Auslan",
  aacFriendly: "AAC friendly",
  plainLanguage: "Plain language",
  homeVisit: "Home visit",
  telehealth: "Telehealth",
  hoistReady: "Hoist ready",
  assistanceAnimalFriendly: "Assistance animal friendly",
  culturalLanguagePreference: "Cultural or language preference",
  genderPreferenceForPersonalCare: "Gender preference for personal care",
  transportSupportNeeded: "Transport support needed",
};

// ─── Availability (W1, W8) ────────────────────────────────────────────────

export const WAITLIST_STATUSES = [
  "none",
  "short",
  "medium",
  "long",
  "closed",
  "unknown",
] as const;

export type WaitlistStatus = (typeof WAITLIST_STATUSES)[number];

export const FUNDING_TYPES = [
  "agency-managed",
  "plan-managed",
  "self-managed",
  "private",
] as const;

export type FundingType = (typeof FUNDING_TYPES)[number];

export const AVAILABILITY_CONFIDENCE_LEVELS = [
  "high",
  "medium",
  "low",
  "unknown",
] as const;

export type AvailabilityConfidence = (typeof AVAILABILITY_CONFIDENCE_LEVELS)[number];

export type ProviderAvailability = {
  providerId: string;
  acceptingNewParticipants: boolean;
  waitlistStatus: WaitlistStatus;
  earliestStartDate: string | null;
  availableDays: string[];
  afterHoursAvailable: boolean;
  weekendAvailable: boolean;
  telehealthAvailable: boolean;
  mobileServiceAvailable: boolean;
  suburbsServed: string[];
  fundingTypesAccepted: FundingType[];
  urgentCapacity: boolean;
  lastAvailabilityUpdated: string;
  availabilityConfidence: AvailabilityConfidence;
};

// ─── Access capabilities (W5) ─────────────────────────────────────────────

export const VERIFICATION_SOURCES = [
  "provider-declared",
  "community-checked",
  "mapable-assessed",
  "unknown",
] as const;

export type VerificationSource = (typeof VERIFICATION_SOURCES)[number];

export type ProviderAccessCapability = {
  providerId: string;
  stepFreeEntry: boolean | null;
  doorWidthMm: number | null;
  accessibleToilet: boolean | null;
  accessibleParking: boolean | null;
  dropOffPoint: string | null;
  publicTransportNearby: boolean | null;
  lowSensoryOption: boolean | null;
  hearingLoop: boolean | null;
  auslanAvailable: boolean | null;
  aacFriendly: boolean | null;
  plainLanguageMaterials: boolean | null;
  telehealthAvailable: boolean | null;
  homeVisitsAvailable: boolean | null;
  assistanceAnimalPolicy: string | null;
  staffDisabilityTraining: boolean | null;
  photosAvailable: boolean;
  measurementsAvailable: boolean;
  lastVerifiedAt: string | null;
  verificationSource: VerificationSource;
};

// ─── Access-fit scoring (W2) ────────────────────────────────────────────────

export type AccessFitLevel =
  | "strong_fit"
  | "possible_fit"
  | "needs_confirmation"
  | "likely_barrier";

export type AccessFitMatchDetail = {
  needId: AccessNeedId;
  status: "match" | "partial" | "barrier" | "unknown";
  explanation: string;
};

export type AccessFitResult = {
  score: number;
  level: AccessFitLevel;
  hardBarriers: AccessNeedId[];
  partialMatches: AccessNeedId[];
  unknowns: AccessNeedId[];
  details: AccessFitMatchDetail[];
  recommendedQuestions: string[];
};

// ─── Wedge provider (unified mock/registry view) ────────────────────────────

export type WedgeProvider = {
  id: string;
  name: string;
  slug: string;
  suburb: string;
  state: string;
  postcode: string;
  categories: string[];
  availability: ProviderAvailability;
  accessCapability: ProviderAccessCapability;
  /** For access-fit: maps AccessNeedId to provider capability value */
  accessCapabilities: Partial<Record<AccessNeedId, boolean | null>>;
};

// ─── Availability filters (W1, W8) ────────────────────────────────────────

export type AvailabilityFilters = {
  availableThisWeek?: boolean;
  noWaitlist?: boolean;
  shortWaitlist?: boolean;
  mobileService?: boolean;
  telehealth?: boolean;
  weekend?: boolean;
  urgentCapacity?: boolean;
  fundingType?: FundingType;
  postcode?: string;
  suburb?: string;
};

// ─── Request Concierge (W3) ─────────────────────────────────────────────────

export const REQUESTER_ROLES = [
  "participant",
  "family_carer",
  "support_coordinator",
  "provider_on_behalf",
  "other",
] as const;

export type RequesterRole = (typeof REQUESTER_ROLES)[number];

export const SUPPORT_CATEGORIES = [
  "therapy",
  "support_worker",
  "support_coordination",
  "transport",
  "employment_support",
  "home_support",
  "community_participation",
  "other",
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export const URGENCY_LEVELS = [
  "this_week",
  "this_month",
  "no_rush",
  "unsure",
] as const;

export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export const SERVICE_MODES = [
  "in_person",
  "mobile_home_visit",
  "telehealth",
  "flexible",
] as const;

export type ServiceMode = (typeof SERVICE_MODES)[number];

export type SupportConciergeRequest = {
  requesterRole: RequesterRole;
  supportCategory: SupportCategory;
  locationPostcode: string;
  locationSuburb: string;
  serviceMode: ServiceMode;
  urgency: UrgencyLevel;
  accessNeeds: AccessNeedId[];
  fundingType: FundingType | "unsure";
  previousIssues: string;
  consentGiven: boolean;
};

export type SupportConciergeSummary = {
  request: SupportConciergeRequest;
  suggestedFilters: AvailabilityFilters;
  suggestedQuestions: string[];
  transportReminders: string[];
  accessReminders: string[];
};

// ─── Trust (W6, W16) ────────────────────────────────────────────────────────

export const EVIDENCE_LABELS = [
  "verified",
  "declared",
  "expired",
  "unknown",
  "not_applicable",
] as const;

export type EvidenceLabel = (typeof EVIDENCE_LABELS)[number];

export type TrustCategory = {
  id: string;
  label: string;
  evidence: EvidenceLabel;
  lastChecked: string | null;
  notes: string | null;
};

export type ProviderTrustScore = {
  providerId: string;
  overallScore: number;
  categories: TrustCategory[];
  summary: string;
};

export const VERIFICATION_LEVELS = [
  "listed",
  "checked",
  "verified",
  "access_verified",
  "outcome_verified",
  "gold_partner",
] as const;

export type VerificationLevel = (typeof VERIFICATION_LEVELS)[number];

// ─── Response SLA (W19) ─────────────────────────────────────────────────────

export const RESPONSE_SLA_STATUSES = [
  "excellent",
  "good",
  "slow",
  "unknown",
] as const;

export type ResponseSlaStatus = (typeof RESPONSE_SLA_STATUSES)[number];

export type ProviderResponseSla = {
  providerId: string;
  averageResponseTimeHours: number | null;
  responseRate: number | null;
  lastRespondedAt: string | null;
  staleRequestsCount: number;
  preferredContactMethod: string | null;
  responseSlaStatus: ResponseSlaStatus;
  enquiryExpiryDays: number | null;
};

// ─── First appointment tracking (W13) ─────────────────────────────────────────

export const REQUEST_PROGRESS_STATUSES = [
  "request_created",
  "shortlist_ready",
  "waiting_for_provider",
  "provider_responded",
  "appointment_booked",
  "transport_arranged",
  "completed",
  "follow_up_needed",
  "stalled",
] as const;

export type RequestProgressStatus = (typeof REQUEST_PROGRESS_STATUSES)[number];

export const REQUEST_BLOCKERS = [
  "no_provider_response",
  "no_availability",
  "transport_barrier",
  "access_barrier",
  "funding_uncertainty",
  "participant_changed_preference",
  "other",
] as const;

export type RequestBlocker = (typeof REQUEST_BLOCKERS)[number];

export type RequestProgress = {
  id: string;
  status: RequestProgressStatus;
  requestSubmittedAt: string | null;
  providerShortlistedAt: string | null;
  providerContactedAt: string | null;
  providerRespondedAt: string | null;
  participantChoseProviderAt: string | null;
  appointmentBookedAt: string | null;
  transportBookedAt: string | null;
  appointmentCompletedAt: string | null;
  invoiceReceivedAt: string | null;
  participantFeedbackAt: string | null;
  followUpNeeded: boolean;
  blockers: RequestBlocker[];
};

// ─── Transport access (W14) ─────────────────────────────────────────────────

export type TransportFeasibilityLevel =
  | "strong"
  | "possible"
  | "needs_planning"
  | "likely_barrier"
  | "unknown";

export type ProviderTransportAccess = {
  providerId: string;
  accessibleParking: boolean | null;
  dropOffPoint: string | null;
  nearestAccessiblePublicTransport: string | null;
  wheelchairAccessibleTaxiSuitable: boolean | null;
  mobileProviderOption: boolean;
  telehealthOption: boolean;
  routeNotes: string | null;
  recommendedArrivalBufferMinutes: number | null;
  returnTripReminder: string | null;
  supportWorkerMeetingPoint: string | null;
  transportFailureBackupNote: string | null;
};

// ─── Standard disclaimers ───────────────────────────────────────────────────

export const AVAILABILITY_DISCLAIMER =
  "Availability shown is based on the provider's latest update and should be confirmed before booking.";

export const NDIS_BOUNDARY_NOTICE =
  "This information is for planning only. MapAble does not decide NDIS eligibility, funding, or reasonable and necessary outcomes.";

export const TRANSPORT_DISCLAIMER =
  "Transport options are estimates and must be confirmed with the provider or transport operator.";

export const VERIFICATION_DISCLAIMER =
  "Verification provides information about checks completed by MapAble. It is not a guarantee of service quality or legal compliance.";
