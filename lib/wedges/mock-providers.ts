import type {
  AccessNeedId,
  ProviderAccessCapability,
  ProviderAvailability,
  ProviderResponseSla,
  ProviderTransportAccess,
  ProviderTrustScore,
  RequestProgress,
  WedgeProvider,
} from "@/types/wedges";

const now = new Date();
const daysAgo = (n: number) =>
  new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
const daysFromNow = (n: number) =>
  new Date(now.getTime() + n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

function baseAvailability(
  overrides: Partial<ProviderAvailability>,
): ProviderAvailability {
  return {
    providerId: overrides.providerId ?? "unknown",
    acceptingNewParticipants: true,
    waitlistStatus: "none",
    earliestStartDate: daysFromNow(7),
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    afterHoursAvailable: false,
    weekendAvailable: false,
    telehealthAvailable: false,
    mobileServiceAvailable: false,
    suburbsServed: [],
    fundingTypesAccepted: ["plan-managed", "self-managed"],
    urgentCapacity: false,
    lastAvailabilityUpdated: daysAgo(3),
    availabilityConfidence: "medium",
    ...overrides,
  };
}

function baseAccessCapability(
  overrides: Partial<ProviderAccessCapability>,
): ProviderAccessCapability {
  return {
    providerId: overrides.providerId ?? "unknown",
    stepFreeEntry: null,
    doorWidthMm: null,
    accessibleToilet: null,
    accessibleParking: null,
    dropOffPoint: null,
    publicTransportNearby: null,
    lowSensoryOption: null,
    hearingLoop: null,
    auslanAvailable: null,
    aacFriendly: null,
    plainLanguageMaterials: null,
    telehealthAvailable: null,
    homeVisitsAvailable: null,
    assistanceAnimalPolicy: null,
    staffDisabilityTraining: null,
    photosAvailable: false,
    measurementsAvailable: false,
    lastVerifiedAt: null,
    verificationSource: "unknown",
    ...overrides,
  };
}

function accessCaps(
  caps: Partial<Record<AccessNeedId, boolean | null>>,
): Partial<Record<AccessNeedId, boolean | null>> {
  return caps;
}

export const MOCK_WEDGE_PROVIDERS: WedgeProvider[] = [
  {
    id: "wedge-001",
    name: "Accessible Therapy Partners",
    slug: "accessible-therapy-partners",
    suburb: "Parramatta",
    state: "NSW",
    postcode: "2150",
    categories: ["Occupational Therapy", "Physiotherapy"],
    availability: baseAvailability({
      providerId: "wedge-001",
      acceptingNewParticipants: true,
      waitlistStatus: "none",
      earliestStartDate: daysFromNow(3),
      telehealthAvailable: true,
      mobileServiceAvailable: true,
      suburbsServed: ["Parramatta", "Westmead", "Harris Park"],
      fundingTypesAccepted: ["agency-managed", "plan-managed", "self-managed"],
      urgentCapacity: true,
      lastAvailabilityUpdated: daysAgo(1),
      availabilityConfidence: "high",
      weekendAvailable: true,
    }),
    accessCapability: baseAccessCapability({
      providerId: "wedge-001",
      stepFreeEntry: true,
      doorWidthMm: 900,
      accessibleToilet: true,
      accessibleParking: true,
      dropOffPoint: "Level access from car park",
      publicTransportNearby: true,
      lowSensoryOption: true,
      auslanAvailable: false,
      aacFriendly: true,
      plainLanguageMaterials: true,
      telehealthAvailable: true,
      homeVisitsAvailable: true,
      assistanceAnimalPolicy: "Welcome with advance notice",
      staffDisabilityTraining: true,
      photosAvailable: true,
      measurementsAvailable: true,
      lastVerifiedAt: daysAgo(14),
      verificationSource: "mapable-assessed",
    }),
    accessCapabilities: accessCaps({
      wheelchairAccess: true,
      stepFreeEntry: true,
      accessibleToilet: true,
      lowSensoryEnvironment: true,
      aacFriendly: true,
      plainLanguage: true,
      homeVisit: true,
      telehealth: true,
      assistanceAnimalFriendly: true,
    }),
  },
  {
    id: "wedge-002",
    name: "Western Sydney Support Co",
    slug: "western-sydney-support-co",
    suburb: "Blacktown",
    state: "NSW",
    postcode: "2148",
    categories: ["Support Worker", "Community Participation"],
    availability: baseAvailability({
      providerId: "wedge-002",
      acceptingNewParticipants: true,
      waitlistStatus: "short",
      earliestStartDate: daysFromNow(14),
      mobileServiceAvailable: true,
      suburbsServed: ["Blacktown", "Mount Druitt", "Rooty Hill"],
      fundingTypesAccepted: ["plan-managed", "self-managed", "private"],
      lastAvailabilityUpdated: daysAgo(5),
      availabilityConfidence: "medium",
    }),
    accessCapability: baseAccessCapability({
      providerId: "wedge-002",
      stepFreeEntry: true,
      accessibleToilet: false,
      homeVisitsAvailable: true,
      plainLanguageMaterials: true,
      staffDisabilityTraining: true,
      lastVerifiedAt: daysAgo(30),
      verificationSource: "provider-declared",
    }),
    accessCapabilities: accessCaps({
      wheelchairAccess: true,
      stepFreeEntry: true,
      plainLanguage: true,
      homeVisit: true,
      transportSupportNeeded: true,
    }),
  },
  {
    id: "wedge-003",
    name: "Coastal Speech & Language",
    slug: "coastal-speech-language",
    suburb: "Wollongong",
    state: "NSW",
    postcode: "2500",
    categories: ["Speech Pathology"],
    availability: baseAvailability({
      providerId: "wedge-003",
      acceptingNewParticipants: false,
      waitlistStatus: "long",
      earliestStartDate: daysFromNow(90),
      telehealthAvailable: true,
      suburbsServed: ["Wollongong", "Figtree"],
      fundingTypesAccepted: ["agency-managed", "plan-managed"],
      lastAvailabilityUpdated: daysAgo(21),
      availabilityConfidence: "low",
    }),
    accessCapability: baseAccessCapability({
      providerId: "wedge-003",
      stepFreeEntry: false,
      accessibleToilet: true,
      telehealthAvailable: true,
      verificationSource: "provider-declared",
    }),
    accessCapabilities: accessCaps({
      accessibleToilet: true,
      telehealth: true,
      plainLanguage: true,
      stepFreeEntry: false,
    }),
  },
  {
    id: "wedge-004",
    name: "Inclusive Behaviour Support NSW",
    slug: "inclusive-behaviour-support",
    suburb: "Newcastle",
    state: "NSW",
    postcode: "2300",
    categories: ["Behaviour Support"],
    availability: baseAvailability({
      providerId: "wedge-004",
      acceptingNewParticipants: true,
      waitlistStatus: "medium",
      earliestStartDate: daysFromNow(21),
      telehealthAvailable: true,
      mobileServiceAvailable: true,
      suburbsServed: ["Newcastle", "Lake Macquarie", "Maitland"],
      fundingTypesAccepted: ["plan-managed", "self-managed"],
      urgentCapacity: false,
      lastAvailabilityUpdated: daysAgo(7),
      availabilityConfidence: "medium",
    }),
    accessCapability: baseAccessCapability({
      providerId: "wedge-004",
      stepFreeEntry: true,
      lowSensoryOption: true,
      aacFriendly: true,
      plainLanguageMaterials: true,
      telehealthAvailable: true,
      homeVisitsAvailable: true,
      staffDisabilityTraining: true,
      lastVerifiedAt: daysAgo(45),
      verificationSource: "community-checked",
    }),
    accessCapabilities: accessCaps({
      lowSensoryEnvironment: true,
      aacFriendly: true,
      plainLanguage: true,
      telehealth: true,
      homeVisit: true,
    }),
  },
  {
    id: "wedge-005",
    name: "Metro Allied Health Hub",
    slug: "metro-allied-health",
    suburb: "Sydney",
    state: "NSW",
    postcode: "2000",
    categories: ["Psychology", "Occupational Therapy"],
    availability: baseAvailability({
      providerId: "wedge-005",
      acceptingNewParticipants: true,
      waitlistStatus: "closed",
      earliestStartDate: null,
      suburbsServed: ["Sydney CBD"],
      fundingTypesAccepted: ["private"],
      lastAvailabilityUpdated: daysAgo(60),
      availabilityConfidence: "unknown",
    }),
    accessCapability: baseAccessCapability({
      providerId: "wedge-005",
      stepFreeEntry: true,
      accessibleParking: false,
      publicTransportNearby: true,
      verificationSource: "unknown",
    }),
    accessCapabilities: accessCaps({
      wheelchairAccess: true,
      stepFreeEntry: true,
      transportSupportNeeded: true,
    }),
  },
];

export function getMockWedgeProvider(id: string): WedgeProvider | undefined {
  return MOCK_WEDGE_PROVIDERS.find((p) => p.id === id);
}

export function getMockWedgeProviderBySlug(
  slug: string,
): WedgeProvider | undefined {
  return MOCK_WEDGE_PROVIDERS.find((p) => p.slug === slug);
}

/** Demo participant access profile for access-fit matching (local only) */
export const DEMO_ACCESS_PROFILE: Partial<
  Record<AccessNeedId, boolean | string>
> = {
  wheelchairAccess: true,
  stepFreeEntry: true,
  accessibleToilet: true,
  plainLanguage: true,
  homeVisit: false,
  telehealth: true,
  transportSupportNeeded: true,
};

export const MOCK_TRUST_SCORES: Record<string, ProviderTrustScore> = {
  "wedge-001": {
    providerId: "wedge-001",
    overallScore: 82,
    summary:
      "Strong verification and accessibility readiness. Response reliability is good based on recent data.",
    categories: [
      { id: "identity", label: "Identity verified", evidence: "verified", lastChecked: daysAgo(30), notes: null },
      { id: "insurance", label: "Insurance verified", evidence: "verified", lastChecked: daysAgo(60), notes: null },
      { id: "screening", label: "Worker screening verified", evidence: "verified", lastChecked: daysAgo(45), notes: null },
      { id: "ndis_reg", label: "NDIS registration checked", evidence: "verified", lastChecked: daysAgo(90), notes: null },
      { id: "response", label: "Response reliability", evidence: "declared", lastChecked: daysAgo(7), notes: "Based on enquiry response data" },
      { id: "accessibility", label: "Accessibility readiness", evidence: "verified", lastChecked: daysAgo(14), notes: null },
      { id: "complaint", label: "Complaint process visible", evidence: "verified", lastChecked: daysAgo(30), notes: null },
      { id: "first_appt", label: "First appointment completion", evidence: "unknown", lastChecked: null, notes: "Not yet verified" },
    ],
  },
  "wedge-002": {
    providerId: "wedge-002",
    overallScore: 68,
    summary:
      "Core credentials verified. Some accessibility details are provider-declared and should be confirmed.",
    categories: [
      { id: "identity", label: "Identity verified", evidence: "verified", lastChecked: daysAgo(60), notes: null },
      { id: "insurance", label: "Insurance verified", evidence: "verified", lastChecked: daysAgo(60), notes: null },
      { id: "accessibility", label: "Accessibility readiness", evidence: "declared", lastChecked: daysAgo(30), notes: null },
      { id: "response", label: "Response reliability", evidence: "declared", lastChecked: daysAgo(14), notes: null },
      { id: "first_appt", label: "First appointment completion", evidence: "unknown", lastChecked: null, notes: null },
    ],
  },
};

export const MOCK_RESPONSE_SLA: Record<string, ProviderResponseSla> = {
  "wedge-001": {
    providerId: "wedge-001",
    averageResponseTimeHours: 4,
    responseRate: 0.92,
    lastRespondedAt: daysAgo(0),
    staleRequestsCount: 0,
    preferredContactMethod: "Email",
    responseSlaStatus: "excellent",
    enquiryExpiryDays: 7,
  },
  "wedge-002": {
    providerId: "wedge-002",
    averageResponseTimeHours: 24,
    responseRate: 0.78,
    lastRespondedAt: daysAgo(2),
    staleRequestsCount: 1,
    preferredContactMethod: "Phone",
    responseSlaStatus: "good",
    enquiryExpiryDays: 14,
  },
  "wedge-003": {
    providerId: "wedge-003",
    averageResponseTimeHours: 72,
    responseRate: 0.45,
    lastRespondedAt: daysAgo(10),
    staleRequestsCount: 3,
    preferredContactMethod: "Email",
    responseSlaStatus: "slow",
    enquiryExpiryDays: 14,
  },
};

export const MOCK_TRANSPORT_ACCESS: Record<string, ProviderTransportAccess> = {
  "wedge-001": {
    providerId: "wedge-001",
    accessibleParking: true,
    dropOffPoint: "Level access from underground car park, bays 12–15",
    nearestAccessiblePublicTransport: "Parramatta Station — lift access, 400m",
    wheelchairAccessibleTaxiSuitable: true,
    mobileProviderOption: true,
    telehealthOption: true,
    routeNotes: "Bus 900 stops outside. Allow extra time for lift at station.",
    recommendedArrivalBufferMinutes: 15,
    returnTripReminder: "Book return transport before appointment if needed.",
    supportWorkerMeetingPoint: "Reception desk, ground floor",
    transportFailureBackupNote: "Contact clinic to reschedule if transport is delayed.",
  },
  "wedge-002": {
    providerId: "wedge-002",
    accessibleParking: false,
    dropOffPoint: "Street parking on Main St — limited accessible bays",
    nearestAccessiblePublicTransport: "Blacktown Station — 800m, ramp access",
    wheelchairAccessibleTaxiSuitable: true,
    mobileProviderOption: true,
    telehealthOption: false,
    routeNotes: "Primarily mobile service — provider travels to you.",
    recommendedArrivalBufferMinutes: 10,
    returnTripReminder: null,
    supportWorkerMeetingPoint: "Your home entrance",
    transportFailureBackupNote: "Mobile service — transport mainly for community outings.",
  },
};

export const MOCK_REQUEST_PROGRESS: RequestProgress[] = [
  {
    id: "req-demo-001",
    status: "provider_responded",
    requestSubmittedAt: daysAgo(10),
    providerShortlistedAt: daysAgo(9),
    providerContactedAt: daysAgo(8),
    providerRespondedAt: daysAgo(5),
    participantChoseProviderAt: null,
    appointmentBookedAt: null,
    transportBookedAt: null,
    appointmentCompletedAt: null,
    invoiceReceivedAt: null,
    participantFeedbackAt: null,
    followUpNeeded: false,
    blockers: [],
  },
  {
    id: "req-demo-002",
    status: "stalled",
    requestSubmittedAt: daysAgo(21),
    providerShortlistedAt: daysAgo(20),
    providerContactedAt: daysAgo(19),
    providerRespondedAt: null,
    participantChoseProviderAt: null,
    appointmentBookedAt: null,
    transportBookedAt: null,
    appointmentCompletedAt: null,
    invoiceReceivedAt: null,
    participantFeedbackAt: null,
    followUpNeeded: true,
    blockers: ["no_provider_response"],
  },
];

export const MOCK_COORDINATOR_PARTICIPANTS = [
  {
    id: "part-demo-001",
    alias: "Alex M.",
    suburb: "Parramatta",
    goals: "Find OT with step-free access and telehealth option",
    activeRequests: 1,
    consentStatus: "active" as const,
  },
  {
    id: "part-demo-002",
    alias: "Jordan K.",
    suburb: "Blacktown",
    goals: "Support worker for community access, weekends preferred",
    activeRequests: 2,
    consentStatus: "active" as const,
  },
];

export const MOCK_COORDINATOR_TASKS = [
  {
    id: "task-001",
    participantAlias: "Alex M.",
    category: "Occupational Therapy",
    urgency: "this_month" as const,
    status: "provider_responded" as const,
    shortlistCount: 3,
    nextAction: "Confirm access needs with shortlisted provider",
  },
  {
    id: "task-002",
    participantAlias: "Jordan K.",
    category: "Support Worker",
    urgency: "this_week" as const,
    status: "waiting_for_provider" as const,
    shortlistCount: 2,
    nextAction: "Follow up on provider response",
  },
];
