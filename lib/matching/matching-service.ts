import type { MatchFactorType, MatchType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordBookingTimelineEvent } from "@/lib/bookings/timeline-service";
import { phase4Config } from "@/lib/config/phase4";
import { findOrganisationsWithinRadiusMeters } from "@/lib/geo/postgis";
import { prisma } from "@/lib/prisma";
import { matchSupportWorkers } from "@/lib/matching/support-worker-matching";
import { getTravelTimeSeconds } from "@/lib/routing/travel-matrix-service";
import { getVehicleSuitabilityWarnings } from "@/lib/transport/vehicle-suitability";
import type { SupportType } from "@/types/support-workers";

function isOrgEligible(verificationStatus: string, status: string) {
  if (status !== "active") return false;
  if (verificationStatus === "suspended" || verificationStatus === "rejected") {
    return false;
  }
  return true;
}

export async function runCareWorkerMatch(
  careRequestId: string,
  requestedById: string
) {
  if (!phase4Config.matchingEngineEnabled) {
    return { skipped: true };
  }

  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
    include: { participant: { include: { accessibilityProfile: true } } },
  });
  if (!request) throw new Error("NOT_FOUND");

  if (phase4Config.supportWorkerMatchingEnabled) {
    const start = request.preferredDate ?? new Date();
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const result = await matchSupportWorkers(
      {
        supportType: request.requestType as SupportType,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        limit: 20,
      },
      request.participantId,
      requestedById
    );
    if (result.matchRunId) {
      await prisma.matchRun.update({
        where: { id: result.matchRunId },
        data: {
          careRequestId,
          bookingId: request.bookingId,
        },
      });
      const run = await prisma.matchRun.findUnique({
        where: { id: result.matchRunId },
        include: { candidates: { include: { factors: true } } },
      });
      return { run, candidates: run?.candidates ?? [] };
    }
  }

  const run = await prisma.matchRun.create({
    data: {
      matchType: "care_worker",
      careRequestId,
      participantId: request.participantId,
      bookingId: request.bookingId,
      requestedById,
      status: "running",
    },
  });

  const workers = await prisma.workerProfile.findMany({
    where: { active: true },
    include: { organisation: true },
    take: 50,
  });

  const candidates = [];
  for (const w of workers) {
    const factors: {
      factorType: MatchFactorType;
      score: number;
      explanation: string;
      weight: number;
    }[] = [];

    const orgOk = w.organisation
      ? isOrgEligible(w.organisation.verificationStatus, w.organisation.status)
      : false;

    if (!orgOk) {
      factors.push({
        factorType: "provider_verification",
        score: 0,
        explanation:
          "Provider is not verified or is inactive — excluded unless admin overrides.",
        weight: 2,
      });
      if (!phase4Config.matchingAllowAdminOverride) continue;
    } else {
      factors.push({
        factorType: "provider_verification",
        score: 1,
        explanation: "Provider verification status acceptable.",
        weight: 1,
      });
    }

    if (w.verificationStatus === "verified") {
      factors.push({
        factorType: "credential_status",
        score: 1,
        explanation: "Worker verification status is verified.",
        weight: 1.5,
      });
    } else {
      factors.push({
        factorType: "credential_status",
        score: 0.3,
        explanation: "Worker verification requires review.",
        weight: 1.5,
      });
    }

    if (
      request.requestType &&
      w.serviceTypes.includes(request.requestType)
    ) {
      factors.push({
        factorType: "service_type",
        score: 1,
        explanation: `Worker lists service type ${request.requestType}.`,
        weight: 1,
      });
    }

    const site = await prisma.serviceSite.findFirst({
      where: { organisationId: w.organisationId, active: true },
    });
    if (site && request.suburb) {
      const nearby = await findOrganisationsWithinRadiusMeters({
        lat: site.lat,
        lng: site.lng,
        radiusMeters: 80_000,
        limit: 5,
      });
      const inRegion = nearby.some((n) => n.organisationId === w.organisationId);
      factors.push({
        factorType: "region",
        score: inRegion ? 1 : 0.4,
        explanation: inRegion
          ? "Provider depot within service radius of request."
          : "Provider may be outside preferred region.",
        weight: 1.2,
      });
    }

    const booking = request.bookingId
      ? await prisma.booking.findUnique({
          where: { id: request.bookingId },
          include: { transportBooking: true },
        })
      : null;
    const pickup = booking?.transportBooking;
    if (site && pickup?.pickupLat != null && pickup.pickupLng != null) {
      try {
        const travel = await getTravelTimeSeconds(
          { lat: site.lat, lng: site.lng },
          { lat: pickup.pickupLat, lng: pickup.pickupLng }
        );
        const travelScore =
          travel.durationSeconds <= 1800
            ? 1
            : travel.durationSeconds <= 3600
              ? 0.6
              : 0.3;
        factors.push({
          factorType: "travel_time",
          score: travelScore,
          explanation: `Estimated travel ~${Math.round(travel.durationSeconds / 60)} minutes from depot.`,
          weight: 1.8,
        });
      } catch {
        factors.push({
          factorType: "travel_time",
          score: 0.5,
          explanation: "Travel time could not be computed; neutral score applied.",
          weight: 0.5,
        });
      }
    }

    const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
    const score =
      totalWeight > 0
        ? factors.reduce((s, f) => s + f.score * f.weight, 0) / totalWeight
        : 0;
    const explanation = factors.map((f) => f.explanation).join(" ");

    const candidate = await prisma.matchCandidate.create({
      data: {
        matchRunId: run.id,
        candidateType: "care_worker",
        candidateWorkerId: w.id,
        candidateOrganisationId: w.organisationId,
        score,
        scoreExplanation: explanation,
        status: score >= 0.7 ? "recommended" : "generated",
        factors: {
          create: factors.map((f) => ({
            factorType: f.factorType,
            weight: f.weight,
            score: f.score,
            explanation: f.explanation,
          })),
        },
      },
    });
    candidates.push(candidate);
  }

  await prisma.matchRun.update({
    where: { id: run.id },
    data: { status: "completed", completedAt: new Date() },
  });

  return { run, candidates };
}

export async function runTransportVehicleMatch(
  transportBookingId: string,
  requestedById: string
) {
  if (!phase4Config.matchingEngineEnabled) return { skipped: true };

  const tb = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
  });
  if (!tb) throw new Error("NOT_FOUND");

  const run = await prisma.matchRun.create({
    data: {
      matchType: "transport_vehicle",
      transportBookingId,
      participantId: tb.participantId,
      bookingId: tb.bookingId,
      requestedById,
      status: "running",
    },
  });

  const reqs = (tb.vehicleRequirements ?? {}) as Record<string, boolean>;
  const vehicles = await prisma.vehicle.findMany({
    where: { active: true },
    include: { organisation: true },
    take: 50,
  });

  const candidates = [];
  for (const v of vehicles) {
    const orgOk = v.organisation
      ? isOrgEligible(v.organisation.verificationStatus, v.organisation.status)
      : false;
    if (!orgOk && !phase4Config.matchingAllowAdminOverride) continue;

    const warnings = getVehicleSuitabilityWarnings(
      {
        requiresWheelchairAccessible: reqs.requiresWheelchairAccessible,
        requiresRamp: reqs.requiresRamp,
      },
      v
    );
    const suitabilityScore = warnings.some((w) => w.includes("not")) ? 0.2 : 1;

    const site = await prisma.serviceSite.findFirst({
      where: { organisationId: v.organisationId, active: true },
    });
    let travelScore = 0.5;
    let travelExplanation = "Travel time not evaluated.";
    if (
      site &&
      tb.pickupLat != null &&
      tb.pickupLng != null
    ) {
      const travel = await getTravelTimeSeconds(
        { lat: site.lat, lng: site.lng },
        { lat: tb.pickupLat, lng: tb.pickupLng }
      );
      travelScore =
        travel.durationSeconds <= 1200
          ? 1
          : travel.durationSeconds <= 2400
            ? 0.7
            : 0.4;
      travelExplanation = `Depot to pickup ~${Math.round(travel.durationSeconds / 60)} min.`;
    }

    const candidate = await prisma.matchCandidate.create({
      data: {
        matchRunId: run.id,
        candidateType: "transport_vehicle",
        candidateVehicleId: v.id,
        candidateOrganisationId: v.organisationId,
        score:
          suitabilityScore *
          travelScore *
          (v.verificationStatus === "verified" ? 1 : 0.6),
        scoreExplanation:
          warnings.length > 0
            ? `${warnings.join(" ")} ${travelExplanation}`
            : `Vehicle appears suitable. ${travelExplanation}`,
        status: suitabilityScore >= 0.7 ? "recommended" : "generated",
        factors: {
          create: [
            {
              factorType: "vehicle_suitability",
              score: suitabilityScore,
              weight: 2,
              explanation: warnings.join(" ") || "No suitability warnings.",
            },
            {
              factorType: "travel_time",
              score: travelScore,
              weight: 1.5,
              explanation: travelExplanation,
            },
            {
              factorType: "provider_verification",
              score: orgOk ? 1 : 0,
              weight: 1,
              explanation: orgOk
                ? "Operator verification acceptable."
                : "Operator not verified.",
            },
          ],
        },
      },
    });
    candidates.push(candidate);
  }

  await prisma.matchRun.update({
    where: { id: run.id },
    data: { status: "completed", completedAt: new Date() },
  });

  return { run, candidates };
}

export async function selectMatchCandidate(
  candidateId: string,
  decidedById: string,
  notes?: string
) {
  const candidate = await prisma.matchCandidate.update({
    where: { id: candidateId },
    data: { status: "selected" },
    include: { matchRun: true },
  });

  await prisma.matchDecision.create({
    data: {
      matchRunId: candidate.matchRunId,
      matchCandidateId: candidateId,
      decidedById,
      decision: "selected",
      notes,
    },
  });

  await createAuditEvent({
    actorUserId: decidedById,
    action: "match.candidate_selected",
    entityType: "MatchCandidate",
    entityId: candidateId,
    participantId: candidate.matchRun.participantId ?? undefined,
  });

  if (candidate.matchRun.bookingId) {
    await recordBookingTimelineEvent({
      bookingId: candidate.matchRun.bookingId,
      eventType: "booking_assigned",
      title: "Match candidate selected — requires human confirmation",
      actorUserId: decidedById,
    });
  }

  return candidate;
}

export async function rejectMatchCandidate(
  candidateId: string,
  _decidedById: string
) {
  return prisma.matchCandidate.update({
    where: { id: candidateId },
    data: { status: "rejected" },
  });
}

export async function runUnifiedSchedulingMatch(params: {
  careRequestId?: string;
  transportBookingId?: string;
  requestedById: string;
}) {
  const results: Record<string, unknown> = {};
  if (params.careRequestId) {
    results.care = await runCareWorkerMatch(
      params.careRequestId,
      params.requestedById
    );
  }
  if (params.transportBookingId) {
    results.transport = await runTransportVehicleMatch(
      params.transportBookingId,
      params.requestedById
    );
  }
  return results;
}

export function participantSafeCandidateSummary(candidate: {
  score: number;
  scoreExplanation: string;
  candidateType: MatchType;
  status: string;
}) {
  return {
    matchQuality:
      candidate.score >= 0.7
        ? "Good fit based on available information"
        : "May need review",
    summary: candidate.scoreExplanation.slice(0, 200),
    status: candidate.status,
  };
}
