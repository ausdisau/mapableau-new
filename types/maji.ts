import type { PermittedHazardEvidence } from "@/types/tfnsw";
import type {
  LatLng,
  RoutingProviderStatus,
  RoutingSource,
  RoutingTrafficMode,
} from "@/types/transport-routing";

export const JOURNEY_OPTIMISATION_PREFERENCES = [
  "lowest_cost",
  "earliest_arrival",
  "balanced",
  "minimise_disruption",
] as const;

export type JourneyOptimisationPreference =
  (typeof JOURNEY_OPTIMISATION_PREFERENCES)[number];

export const ROUTE_RECOMMENDATION_STATUSES = [
  "recommended",
  "no_alternative",
  "source_unavailable",
  "stale",
  "insufficient_price_information",
  "constraint_violation",
  "human_review_required",
  "advisory_expired",
  "dismissed",
] as const;

export type RouteRecommendationStatus =
  (typeof ROUTE_RECOMMENDATION_STATUSES)[number];

export const JOURNEY_ADVICE_DECISIONS = [
  "pending",
  "acknowledged",
  "dismissed",
  "referred",
] as const;

export type JourneyAdviceDecision = (typeof JOURNEY_ADVICE_DECISIONS)[number];

export const JOURNEY_CANDIDATE_ROLES = [
  "current",
  "alternative",
  "recommended",
] as const;

export type JourneyCandidateRole = (typeof JOURNEY_CANDIDATE_ROLES)[number];

export const JOURNEY_ORIGIN_KINDS = ["live", "synthetic"] as const;

export type JourneyOriginKind = (typeof JOURNEY_ORIGIN_KINDS)[number];

export const TOLL_LINE_STATUSES = [
  "estimated",
  "insufficient_price_information",
] as const;

export type TollLineStatus = (typeof TOLL_LINE_STATUSES)[number];

export type TrafficDataProvenance = {
  source: RoutingSource;
  trafficModeApplied: RoutingTrafficMode;
  liveTrafficUsed: boolean;
  providerStatus: RoutingProviderStatus;
  generatedAt: string;
  validUntil: string | null;
  originKind: JourneyOriginKind;
  sydneyFreshnessLabel: string;
};

export type RemainingRouteCostEstimate = {
  paidDriverTimeCents: number | null;
  distanceCostCents: number | null;
  energyAllowanceCents: number | null;
  tollCents: number | null;
  extraChargesCents: number | null;
  totalRemainingCents: number | null;
  operatingCostDifferenceCents: number | null;
  tollLineStatus: TollLineStatus;
};

export type RouteConstraintResult = {
  passed: boolean;
  status: Extract<
    RouteRecommendationStatus,
    "constraint_violation" | "human_review_required"
  > | null;
  reasons: string[];
  accessibilityPassed: boolean | null;
  arrivalCommitmentPassed: boolean | null;
  closedRoadMatched: boolean;
  requiresHumanReview: boolean;
};

export type TrafficAwareRouteCandidate = {
  id: string;
  role: JourneyCandidateRole;
  label: string;
  remainingDurationSeconds: number;
  remainingDistanceMetres: number;
  estimatedArrivalAt: string;
  liveTrafficUsed: boolean;
  source: RoutingSource;
  trafficModeApplied: RoutingTrafficMode;
  providerStatus: RoutingProviderStatus;
  validUntil: string | null;
  geometry?: LatLng[];
  cost: RemainingRouteCostEstimate;
  constraints: RouteConstraintResult;
  timeSavingSeconds: number | null;
  includeReasons: string[];
  excludeReasons: string[];
  hazardEvidence: PermittedHazardEvidence[];
};

export type JourneyEvaluationContext = {
  tripId: string;
  preference: JourneyOptimisationPreference;
  origin: LatLng;
  originKind: JourneyOriginKind;
  destination: LatLng;
  evaluatedAt: string;
  scheduledStart: string;
  scheduledEnd: string | null;
  boardingBufferSeconds: number;
  commitmentAt: string;
  acceptedQuoteTotalCents: number | null;
};

export type RouteRecommendation = {
  advisoryOnly: true;
  bookingUnchanged: true;
  quoteUnchanged: true;
  adviceId: string;
  tripId: string;
  status: RouteRecommendationStatus;
  preference: JourneyOptimisationPreference;
  decision: JourneyAdviceDecision;
  explanation: string;
  requiresHumanReview: boolean;
  evaluatedAt: string;
  expiresAt: string;
  acceptedQuoteTotalCents: number | null;
  provenance: TrafficDataProvenance;
  current: TrafficAwareRouteCandidate | null;
  recommended: TrafficAwareRouteCandidate | null;
  alternatives: TrafficAwareRouteCandidate[];
};

export type JourneyEvaluationAuditEvent = {
  type: "maji_evaluated" | "maji_dismissed" | "maji_referred";
  tripId: string;
  adviceId: string;
  status: RouteRecommendationStatus;
  preference: JourneyOptimisationPreference;
  decision?: JourneyAdviceDecision;
};

export const MAJI_ADVISORY_COPY =
  "This is an advisory comparison only. It does not change the booking, the accepted quote, or NDIS funding. A person still needs to confirm any route change.";
