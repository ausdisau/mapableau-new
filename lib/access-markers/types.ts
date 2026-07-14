export type AccessMarkerDomainKey =
  | "overall"
  | "mobility"
  | "toilet"
  | "parkingDropoff"
  | "sensory"
  | "communication"
  | "staffService";

export type AccessMarkerRatingInput = {
  overallRating?: number | null;
  mobilityRating?: number | null;
  toiletRating?: number | null;
  parkingDropoffRating?: number | null;
  sensoryRating?: number | null;
  communicationRating?: number | null;
  staffServiceRating?: number | null;
  visitedAt?: string | null;
  visitedInPerson: boolean;
  usedMobilityAid?: boolean | null;
  mobilityAidType?:
    | "manual_wheelchair"
    | "powerchair"
    | "mobility_scooter"
    | "walker"
    | "cane"
    | "other"
    | null;
};

export type AccessMarkerCommentType =
  | "general"
  | "mobility"
  | "toilet"
  | "parking"
  | "sensory"
  | "communication"
  | "staff_service"
  | "temporary_alert"
  | "transport_dropoff"
  | "correction";

export type AccessMarkerModerationFlags = {
  privacyRisk?: boolean;
  abusiveLanguage?: boolean;
  legalClaimRisk?: boolean;
  unsafeAdvice?: boolean;
  containsPersonalInfo?: boolean;
};

export type AccessMarkerDomainScores = {
  overallScore: number;
  mobilityScore: number;
  toiletScore: number;
  parkingDropoffScore: number;
  sensoryScore: number;
  communicationScore: number;
  staffServiceScore: number;
};

export type AccessMarkerAggregateScore = AccessMarkerDomainScores & {
  placeId: string;
  confidenceScore: number;
  ratingCount: number;
  commentCount: number;
  verifiedCount: number;
  disputedCount: number;
  lastRatedAt?: string;
  lastVerifiedAt?: string;
  lastCheckedAt?: string;
};

export type AccessMarkerSummary = {
  placeId: string;
  name: string;
  category: string;
  addressOrSuburb: string | null;
  latitude: number | null;
  longitude: number | null;
  overallScore: number;
  confidenceScore: number;
  ratingCount: number;
  commentCount: number;
  lastCheckedAt: string | null;
  domainScores: {
    mobility: number;
    toilet: number;
    parkingDropoff: number;
    sensory: number;
    communication: number;
    staffService: number;
  };
  latestComments: Array<{
    id: string;
    commentType: AccessMarkerCommentType;
    body: string;
    createdAt: string;
  }>;
  activeAlerts: Array<{
    id: string;
    body: string;
    createdAt: string;
  }>;
  preferredAccessibleEntrance?: string | null;
  accessibleDropoffPoint?: string | null;
};

export const RATING_SCALE_LABELS: Record<number, string> = {
  0: "I don’t know / not applicable",
  1: "Not accessible",
  2: "Difficult",
  3: "Usable with caution",
  4: "Good",
  5: "Excellent",
};

export const DOMAIN_FIELD_LABELS: Record<AccessMarkerDomainKey, string> = {
  overall: "Overall access",
  mobility: "Mobility",
  toilet: "Toilet",
  parkingDropoff: "Parking / drop-off",
  sensory: "Sensory",
  communication: "Communication",
  staffService: "Staff / service",
};
