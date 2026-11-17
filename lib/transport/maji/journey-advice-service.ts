import type { Prisma, TransportTrip } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/current-user";
import { majiConfig, resolveMajiSyntheticRates } from "@/lib/config/maji";
import { prisma } from "@/lib/prisma";
import { estimateTollsForGeometry } from "@/lib/tfnsw/toll-calculator-adapter";
import {
  buildTrafficAdvisoryForRoute,
  permittedHazardEvidence,
} from "@/lib/tfnsw/traffic-advisory-service";
import { generateRouteVariants } from "@/lib/transport/maji/candidate-generator";
import { evaluateRouteConstraints } from "@/lib/transport/maji/constraint-filter";
import { liveTrafficUsedForAdvice } from "@/lib/transport/maji/live-label";
import { estimateRemainingOperatingCost } from "@/lib/transport/maji/operating-cost-engine";
import { resolveJourneyOrigin } from "@/lib/transport/maji/origin";
import {
  freshnessLabel,
  presentJourneyAdvice,
  type AdviceRow,
} from "@/lib/transport/maji/present";
import { rankRouteCandidates } from "@/lib/transport/maji/ranker";
import { getAcceptedQuoteTotalCentsForTripRequest } from "@/lib/transport/quotes/quote-service";
import { boardingBufferSecondsForMobility } from "@/lib/transport/routing/boarding-buffer";
import { formatCoord, timeBucketIso } from "@/lib/transport/routing/route-cache-service";
import {
  assertCanAccessTrip,
  getActiveAssignment,
} from "@/lib/transport/transport-access-policy";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { checkVehicleEligibility } from "@/lib/transport/transport-eligibility-service";
import { recordTripEvent } from "@/lib/transport/transport-event-service";
import type {
  JourneyAdviceDecision,
  JourneyOptimisationPreference,
  RemainingRouteCostEstimate,
  RouteRecommendation,
  TrafficAwareRouteCandidate,
} from "@/types/maji";
import { MAJI_ADVISORY_COPY } from "@/types/maji";
import type { PermittedHazardEvidence } from "@/types/tfnsw";
import type { LatLng, RoutingSource } from "@/types/transport-routing";

function requireMaji() {
  if (!majiConfig.advisoryEnabled) {
    throw new TransportApiError("TRANSPORT_MAJI_DISABLED");
  }
}

function tripDestination(trip: TransportTrip): LatLng | null {
  if (trip.dropoffLat == null || trip.dropoffLng == null) return null;
  return { lat: trip.dropoffLat, lng: trip.dropoffLng };
}

function remainingBoardingSeconds(trip: TransportTrip): number {
  if (
    trip.status === "participant_boarded" ||
    trip.status === "en_route_to_dropoff" ||
    trip.status === "arrived_at_dropoff"
  ) {
    return 0;
  }
  return boardingBufferSecondsForMobility(trip.mobilityRequirements);
}

function commitmentAt(trip: TransportTrip, boardingSeconds: number): Date {
  if (trip.scheduledEnd) return trip.scheduledEnd;
  return new Date(trip.scheduledStart.getTime() + boardingSeconds * 1000);
}

function idempotencyKey(params: {
  tripId: string;
  preference: JourneyOptimisationPreference;
  origin: LatLng;
  originKind: string;
  at: Date;
}): string {
  return [
    params.tripId,
    params.preference,
    params.originKind,
    formatCoord(params.origin),
    timeBucketIso(params.at),
  ].join("|");
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}

function vehicleClassFromEligibility(params: {
  hoist?: boolean;
  lift?: boolean;
}): "A" | "B" {
  return params.hoist || params.lift ? "B" : "A";
}

async function loadAdvice(id: string): Promise<AdviceRow | null> {
  return prisma.transportJourneyAdvice.findUnique({
    where: { id },
    include: { candidates: true },
  }) as Promise<AdviceRow | null>;
}

function costFields(cost: RemainingRouteCostEstimate) {
  return {
    paidDriverTimeCents: cost.paidDriverTimeCents,
    distanceCostCents: cost.distanceCostCents,
    energyAllowanceCents: cost.energyAllowanceCents,
    tollCents: cost.tollCents,
    extraChargesCents: cost.extraChargesCents,
    totalRemainingCents: cost.totalRemainingCents,
    operatingCostDifferenceCents: cost.operatingCostDifferenceCents,
  };
}

export async function evaluateJourneyAdvice(
  user: CurrentUser,
  tripId: string,
  input: {
    preference: JourneyOptimisationPreference;
    syntheticOrigin?: LatLng;
  }
): Promise<RouteRecommendation> {
  requireMaji();
  const trip = await prisma.transportTrip.findUnique({
    where: { id: tripId },
    include: { stops: true },
  });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  await assertCanAccessTrip(user, trip, "summary");

  const now = new Date();
  const origin = await resolveJourneyOrigin({
    trip,
    stops: trip.stops,
    syntheticOrigin: input.syntheticOrigin,
  });
  const destination = tripDestination(trip);
  if (!origin || !destination) {
    throw new TransportApiError(
      "TRANSPORT_ROUTE_NOT_FOUND",
      "This trip does not have enough location data for a remaining-route comparison."
    );
  }

  const key = idempotencyKey({
    tripId,
    preference: input.preference,
    origin: origin.point,
    originKind: origin.kind,
    at: now,
  });

  const existing = await prisma.transportJourneyAdvice.findUnique({
    where: { idempotencyKey: key },
    include: { candidates: true },
  });
  if (existing && !isExpired(existing.expiresAt, now)) {
    return presentJourneyAdvice(existing as AdviceRow);
  }
  if (existing) {
    await prisma.transportJourneyAdvice.delete({ where: { id: existing.id } });
  }

  const recent = await prisma.transportJourneyAdvice.findFirst({
    where: {
      tripId,
      evaluatedAt: { gt: new Date(now.getTime() - majiConfig.cooldownSeconds * 1000) },
    },
    orderBy: { evaluatedAt: "desc" },
    include: { candidates: true },
  });
  if (recent && !isExpired(recent.expiresAt, now) && recent.preference === input.preference) {
    return presentJourneyAdvice(recent as AdviceRow);
  }

  const boardingBufferSeconds = remainingBoardingSeconds(trip);
  const generated = await generateRouteVariants({
    origin: origin.point,
    destination,
    originKind: origin.kind,
    tripId,
    boardingBufferSeconds,
    departAt: now.toISOString(),
  });

  const acceptedQuoteTotalCents = await getAcceptedQuoteTotalCentsForTripRequest(
    trip.tripRequestId
  );
  const rates = resolveMajiSyntheticRates();
  const assignment = await getActiveAssignment(tripId);
  const vehicleEligibility = assignment?.vehicleId
    ? await checkVehicleEligibility(
        assignment.vehicleId,
        (trip.mobilityRequirements ?? {}) as Record<string, unknown>
      )
    : null;
  const vehicleClass = vehicleClassFromEligibility({});

  const commitment = commitmentAt(trip, boardingBufferSeconds);
  const candidates: TrafficAwareRouteCandidate[] = [];

  for (const variant of generated.variants) {
    const validUntil = toDate(variant.estimate.validUntil);
    const live = liveTrafficUsedForAdvice({
      liveTrafficUsed: variant.estimate.liveTrafficUsed,
      validUntil,
      now,
    });

    const advisory = await buildTrafficAdvisoryForRoute({
      origin: origin.point,
      destination,
      geometry: variant.estimate.geometry,
      force: true,
    });
    const hazards: PermittedHazardEvidence[] = advisory
      ? permittedHazardEvidence(advisory).hazards
      : [];
    const remainingDurationSeconds = variant.estimate.durationSeconds;
    const estimatedArrivalAt = new Date(
      now.getTime() + remainingDurationSeconds * 1000
    );
    const constraints = evaluateRouteConstraints({
      mobility: trip.mobilityRequirements,
      vehicleAssigned: Boolean(assignment?.vehicleId),
      vehicleEligibility,
      hazards,
      estimatedArrivalAt,
      commitmentAt: commitment,
    });
    const tolls = await estimateTollsForGeometry({
      geometry: variant.estimate.geometry,
      vehicleClass,
    });
    const cost = estimateRemainingOperatingCost({
      remainingDurationSeconds,
      remainingDistanceMetres: variant.estimate.distanceMetres,
      centsPerKm: rates.centsPerKm,
      centsPerPaidMinute: rates.centsPerPaidMinute,
      energyAllowanceCents: null,
      extraChargesCents: null,
      tollCents: tolls.tollCents,
      tollLineStatus: tolls.status,
    });

    candidates.push({
      id: variant.key,
      role: variant.role,
      label: variant.label,
      remainingDurationSeconds,
      remainingDistanceMetres: variant.estimate.distanceMetres,
      estimatedArrivalAt: estimatedArrivalAt.toISOString(),
      liveTrafficUsed: live,
      source: variant.estimate.source,
      trafficModeApplied:
        variant.estimate.trafficMode === "live" ||
        variant.estimate.trafficMode === "historical" ||
        variant.estimate.trafficMode === "none"
          ? variant.estimate.trafficMode
          : "none",
      providerStatus:
        variant.estimate.providerStatus === "ok" ||
        variant.estimate.providerStatus === "fallback" ||
        variant.estimate.providerStatus === "unavailable" ||
        variant.estimate.providerStatus === "cost_limited" ||
        variant.estimate.providerStatus === "misconfigured"
          ? variant.estimate.providerStatus
          : "ok",
      validUntil: validUntil?.toISOString() ?? null,
      geometry: variant.estimate.geometry,
      cost,
      constraints,
      timeSavingSeconds: null,
      includeReasons: [],
      excludeReasons: constraints.reasons,
      hazardEvidence: hazards,
    });
  }

  const current = candidates.find((c) => c.role === "current") ?? candidates[0] ?? null;
  const alternatives = candidates.filter((c) => c.id !== current?.id);
  const stale = candidates.some(
    (c) => c.validUntil != null && new Date(c.validUntil).getTime() <= now.getTime()
  );
  const ranked = rankRouteCandidates({
    preference: input.preference,
    current,
    alternatives,
    thresholds: {
      minTimeSavingSeconds: majiConfig.minTimeSavingSeconds,
      minCostSavingCents: majiConfig.minCostSavingCents,
    },
    sourceUnavailable: generated.sourceUnavailable || generated.costLimited,
    stale: stale && current == null,
  });

  const expiresAt = new Date(
    Math.min(
      ...[
        ...candidates
          .map((c) => (c.validUntil ? Date.parse(c.validUntil) : NaN))
          .filter((ms) => Number.isFinite(ms)),
        now.getTime() + (current?.liveTrafficUsed ? 3 : 15) * 60 * 1000,
      ]
    )
  );

  const provenance = {
    source: (current?.source ?? "mock") as RoutingSource,
    trafficModeApplied: current?.trafficModeApplied ?? "none",
    liveTrafficUsed: Boolean(current?.liveTrafficUsed),
    providerStatus: current?.providerStatus ?? "unavailable",
    generatedAt: now.toISOString(),
    validUntil: expiresAt.toISOString(),
    originKind: origin.kind,
    sydneyFreshnessLabel: freshnessLabel({
      generatedAt: now.toISOString(),
      liveTrafficUsed: Boolean(current?.liveTrafficUsed),
      source: current?.source ?? "mock",
    }),
  };

  const persistCandidates = [
    ranked.current,
    ranked.recommended,
    ...ranked.alternatives,
  ].filter((c): c is TrafficAwareRouteCandidate => Boolean(c));

  const unique = new Map<string, TrafficAwareRouteCandidate>();
  for (const candidate of persistCandidates) {
    unique.set(candidate.id, candidate);
  }

  const created = await prisma.transportJourneyAdvice.create({
    data: {
      tripId,
      preference: input.preference,
      status: ranked.status,
      decision: "pending",
      evaluatedAt: now,
      expiresAt,
      actorUserId: user.id,
      explanation: `${ranked.explanation} ${MAJI_ADVISORY_COPY}`,
      provenanceJson: provenance as Prisma.InputJsonValue,
      requiresHumanReview: ranked.requiresHumanReview,
      idempotencyKey: key,
      advisoryOnly: true,
      bookingUnchanged: true,
      quoteUnchanged: true,
      acceptedQuoteTotalCents,
      originKind: origin.kind,
      candidates: {
        create: [...unique.values()].map((candidate) => ({
          role: candidate.role,
          label: candidate.label,
          remainingDurationSeconds: candidate.remainingDurationSeconds,
          remainingDistanceMetres: candidate.remainingDistanceMetres,
          liveTrafficUsed: candidate.liveTrafficUsed,
          source: candidate.source,
          trafficMode: candidate.trafficModeApplied,
          providerStatus: candidate.providerStatus,
          validUntil: candidate.validUntil
            ? new Date(candidate.validUntil)
            : null,
          estimatedArrivalAt: new Date(candidate.estimatedArrivalAt),
          ...costFields(candidate.cost),
          timeSavingSeconds: candidate.timeSavingSeconds,
          constraintJson: candidate.constraints as unknown as Prisma.InputJsonValue,
          hazardEvidence: candidate.hazardEvidence as unknown as Prisma.InputJsonValue,
        })),
      },
    },
    include: { candidates: true },
  });

  await recordTripEvent({
    tripId,
    actorUserId: user.id,
    eventType: "maji_evaluated",
    message: ranked.explanation,
    metadata: {
      adviceId: created.id,
      status: ranked.status,
      preference: input.preference,
      originKind: origin.kind,
    },
    participantId: trip.participantId,
    organisationId: trip.providerOrganisationId ?? undefined,
  });

  return presentJourneyAdvice(created as AdviceRow);
}

export async function recordJourneyAdviceDecision(
  user: CurrentUser,
  tripId: string,
  adviceId: string,
  decision: Exclude<JourneyAdviceDecision, "pending">
): Promise<RouteRecommendation> {
  requireMaji();
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  await assertCanAccessTrip(user, trip, "summary");

  const assignment = await getActiveAssignment(tripId);
  const isDriver = assignment?.driver?.userId === user.id;
  if (isDriver && trip.participantId !== user.id) {
    throw new TransportApiError(
      "TRANSPORT_ACCESS_DENIED",
      "Drivers can review the comparison list but cannot confirm or dismiss it while driving."
    );
  }

  const advice = await loadAdvice(adviceId);
  if (!advice || advice.tripId !== tripId) {
    throw new TransportApiError("TRANSPORT_MAJI_ADVICE_NOT_FOUND");
  }

  if (isExpired(advice.expiresAt)) {
    const expired = await prisma.transportJourneyAdvice.update({
      where: { id: adviceId },
      data: { status: "advisory_expired" },
      include: { candidates: true },
    });
    return presentJourneyAdvice(expired as AdviceRow);
  }

  const status =
    decision === "dismissed" ? "dismissed" : advice.status;
  const updated = await prisma.transportJourneyAdvice.update({
    where: { id: adviceId },
    data: { decision, status },
    include: { candidates: true },
  });

  if (decision === "dismissed" || decision === "referred") {
    await recordTripEvent({
      tripId,
      actorUserId: user.id,
      eventType: decision === "dismissed" ? "maji_dismissed" : "maji_referred",
      metadata: { adviceId, decision },
      participantId: trip.participantId,
      organisationId: trip.providerOrganisationId ?? undefined,
    });
  }

  return presentJourneyAdvice(updated as AdviceRow);
}
