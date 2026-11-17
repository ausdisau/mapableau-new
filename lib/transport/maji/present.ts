import type {
  JourneyAdviceDecision,
  JourneyOptimisationPreference,
  JourneyOriginKind,
  RemainingRouteCostEstimate,
  RouteConstraintResult,
  RouteRecommendation,
  RouteRecommendationStatus,
  TrafficAwareRouteCandidate,
  TrafficDataProvenance,
  TollLineStatus,
} from "@/types/maji";
import { MAJI_ADVISORY_COPY } from "@/types/maji";
import type { PermittedHazardEvidence } from "@/types/tfnsw";
import type {
  RoutingProviderStatus,
  RoutingSource,
  RoutingTrafficMode,
} from "@/types/transport-routing";

export function formatSydney(iso?: string | Date | null): string | null {
  if (!iso) return null;
  const date = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-AU", {
    timeZone: "Australia/Sydney",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function freshnessLabel(params: {
  generatedAt: string;
  liveTrafficUsed: boolean;
  source: string;
}): string {
  const when = formatSydney(params.generatedAt) ?? params.generatedAt;
  if (params.liveTrafficUsed) {
    return `Live traffic used. Freshness ${when} (Sydney).`;
  }
  if (params.source === "mock") {
    return `Sandbox estimate. Typical road speeds only. Freshness ${when} (Sydney).`;
  }
  return `Not live traffic. Typical road speeds only. Freshness ${when} (Sydney).`;
}

function asConstraint(value: unknown): RouteConstraintResult {
  if (!value || typeof value !== "object") {
    return {
      passed: true,
      status: null,
      reasons: [],
      accessibilityPassed: null,
      arrivalCommitmentPassed: null,
      closedRoadMatched: false,
      requiresHumanReview: false,
    };
  }
  const row = value as Partial<RouteConstraintResult>;
  return {
    passed: row.passed !== false,
    status: row.status ?? null,
    reasons: Array.isArray(row.reasons) ? row.reasons.filter((r) => typeof r === "string") : [],
    accessibilityPassed: row.accessibilityPassed ?? null,
    arrivalCommitmentPassed: row.arrivalCommitmentPassed ?? null,
    closedRoadMatched: Boolean(row.closedRoadMatched),
    requiresHumanReview: Boolean(row.requiresHumanReview),
  };
}

function asHazards(value: unknown): PermittedHazardEvidence[] {
  if (!value || typeof value !== "object") return [];
  const hazards = Array.isArray(value)
    ? value
    : (value as { hazards?: unknown }).hazards;
  if (!Array.isArray(hazards)) return [];
  return hazards.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const hazard = item as PermittedHazardEvidence;
    return [
      {
        id: hazard.id,
        category: hazard.category,
        headline: hazard.headline,
        subCategory: hazard.subCategory,
        distanceToRouteMetres: hazard.distanceToRouteMetres,
      },
    ];
  });
}

export type AdviceRow = {
  id: string;
  tripId: string;
  preference: string;
  status: string;
  decision: string;
  evaluatedAt: Date;
  expiresAt: Date;
  explanation: string;
  provenanceJson: unknown;
  requiresHumanReview: boolean;
  acceptedQuoteTotalCents: number | null;
  originKind: string;
  candidates: Array<{
    id: string;
    role: string;
    label: string;
    remainingDurationSeconds: number;
    remainingDistanceMetres: number;
    liveTrafficUsed: boolean;
    source: string;
    trafficMode: string | null;
    providerStatus: string | null;
    validUntil: Date | null;
    estimatedArrivalAt: Date | null;
    paidDriverTimeCents: number | null;
    distanceCostCents: number | null;
    energyAllowanceCents: number | null;
    tollCents: number | null;
    extraChargesCents: number | null;
    totalRemainingCents: number | null;
    operatingCostDifferenceCents: number | null;
    timeSavingSeconds: number | null;
    constraintJson: unknown;
    hazardEvidence: unknown;
  }>;
};

function costFromRow(row: AdviceRow["candidates"][number]): RemainingRouteCostEstimate {
  return {
    paidDriverTimeCents: row.paidDriverTimeCents,
    distanceCostCents: row.distanceCostCents,
    energyAllowanceCents: row.energyAllowanceCents,
    tollCents: row.tollCents,
    extraChargesCents: row.extraChargesCents,
    totalRemainingCents: row.totalRemainingCents,
    operatingCostDifferenceCents: row.operatingCostDifferenceCents,
    tollLineStatus:
      row.tollCents == null
        ? ("insufficient_price_information" as TollLineStatus)
        : "estimated",
  };
}

function candidateFromRow(
  row: AdviceRow["candidates"][number]
): TrafficAwareRouteCandidate {
  return {
    id: row.id,
    role: row.role as TrafficAwareRouteCandidate["role"],
    label: row.label,
    remainingDurationSeconds: row.remainingDurationSeconds,
    remainingDistanceMetres: row.remainingDistanceMetres,
    estimatedArrivalAt: row.estimatedArrivalAt?.toISOString() ?? "",
    liveTrafficUsed: row.liveTrafficUsed,
    source: row.source as RoutingSource,
    trafficModeApplied: (row.trafficMode as RoutingTrafficMode) ?? "none",
    providerStatus: (row.providerStatus as RoutingProviderStatus) ?? "ok",
    validUntil: row.validUntil?.toISOString() ?? null,
    cost: costFromRow(row),
    constraints: asConstraint(row.constraintJson),
    timeSavingSeconds: row.timeSavingSeconds,
    includeReasons: [],
    excludeReasons: asConstraint(row.constraintJson).reasons,
    hazardEvidence: asHazards(row.hazardEvidence),
  };
}

export function presentJourneyAdvice(row: AdviceRow): RouteRecommendation {
  const candidates = row.candidates.map(candidateFromRow);
  const current = candidates.find((c) => c.role === "current") ?? null;
  const recommended =
    candidates.find((c) => c.role === "recommended") ?? null;
  const alternatives = candidates.filter((c) => c.role === "alternative");
  const provenance = (row.provenanceJson ?? {}) as Partial<TrafficDataProvenance>;
  const generatedAt =
    provenance.generatedAt ?? row.evaluatedAt.toISOString();
  const liveTrafficUsed = Boolean(
    provenance.liveTrafficUsed ?? current?.liveTrafficUsed
  );
  const source = (provenance.source ?? current?.source ?? "mock") as RoutingSource;

  return {
    advisoryOnly: true,
    bookingUnchanged: true,
    quoteUnchanged: true,
    adviceId: row.id,
    tripId: row.tripId,
    status: row.status as RouteRecommendationStatus,
    preference: row.preference as JourneyOptimisationPreference,
    decision: row.decision as JourneyAdviceDecision,
    explanation: row.explanation || MAJI_ADVISORY_COPY,
    requiresHumanReview: row.requiresHumanReview,
    evaluatedAt: row.evaluatedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    acceptedQuoteTotalCents: row.acceptedQuoteTotalCents,
    provenance: {
      source,
      trafficModeApplied:
        provenance.trafficModeApplied ?? current?.trafficModeApplied ?? "none",
      liveTrafficUsed,
      providerStatus: provenance.providerStatus ?? current?.providerStatus ?? "ok",
      generatedAt,
      validUntil: provenance.validUntil ?? current?.validUntil ?? null,
      originKind: (row.originKind as JourneyOriginKind) ?? "synthetic",
      sydneyFreshnessLabel: freshnessLabel({
        generatedAt,
        liveTrafficUsed,
        source,
      }),
    },
    current,
    recommended,
    alternatives,
  };
}
