import type { MatchFactorType, MatchType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordBookingTimelineEvent } from "@/lib/bookings/timeline-service";
import { phase4Config } from "@/lib/config/phase4";
import { platformPatternsConfig } from "@/lib/config/platform-patterns";
import {
  assertAgentRunAllowsAction,
  createAgentRun,
} from "@/lib/agent-ops/agent-run-service";
import {
  assertReadyToMatchForParticipant,
  assertReadyToMatchForWorker,
} from "@/lib/onboarding/onboarding-service";
import { getLatestReliabilityAdvisory } from "@/lib/reliability/reliability-service";
import { prisma } from "@/lib/prisma";
import type { GuardrailDecision } from "@/server/agents/care/types";
import { getVehicleSuitabilityWarnings } from "@/lib/transport/vehicle-suitability";

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

  if (platformPatternsConfig.onboardingGateEnabled) {
    await assertReadyToMatchForParticipant(request.participantId);
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

  const rankedMatches: {
    workerId: string;
    score: number;
    explanation: string;
    risks: string[];
    missingChecks: string[];
    guardrailDecision: GuardrailDecision;
    reliabilityAdvisory?: string;
  }[] = [];

  const candidates = [];
  for (const w of workers) {
    if (platformPatternsConfig.onboardingGateEnabled) {
      try {
        await assertReadyToMatchForWorker(w.id);
      } catch {
        continue;
      }
    }

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

    const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
    const score =
      totalWeight > 0
        ? factors.reduce((s, f) => s + f.score * f.weight, 0) / totalWeight
        : 0;
    const explanation = factors.map((f) => f.explanation).join(" ");
    const risks: string[] = [];
    const missingChecks: string[] = [];
    if (w.verificationStatus !== "verified") {
      risks.push("Worker verification is not complete");
      missingChecks.push("worker_verification");
    }
    if (!orgOk) {
      risks.push("Provider organisation is not verified");
      missingChecks.push("provider_verification");
    }

    let reliabilityAdvisory: string | undefined;
    if (platformPatternsConfig.reliabilityAdvisoryEnabled) {
      const advisory = await getLatestReliabilityAdvisory(w.id);
      reliabilityAdvisory = advisory.advisorySummary;
    }

    const guardrailDecision: GuardrailDecision = {
      allowed: score >= 0.5 && orgOk,
      autoAssignWorkers: false,
      autoFinalizeBooking: false,
      humanReviewRequired: score < 0.7 || risks.length > 0,
      personalCareConfirmationRequired: false,
      blockedReasons: score < 0.5 ? ["Score below threshold"] : [],
      appliedRules: ["matching_mvp_v1"],
    };

    rankedMatches.push({
      workerId: w.id,
      score,
      explanation,
      risks,
      missingChecks,
      guardrailDecision,
      reliabilityAdvisory,
    });

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

  await createAgentRun({
    agentType: "matching",
    participantId: request.participantId,
    matchRunId: run.id,
    inputSummary: { careRequestId },
    outputSummary: {
      candidateCount: candidates.length,
      topScore: rankedMatches[0]?.score ?? 0,
    },
    humanReviewRequired: rankedMatches.some((m) => m.guardrailDecision.humanReviewRequired),
    participantConfirmationRequired: true,
    actorUserId: requestedById,
  });

  return { run, candidates, rankedMatches };
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

    const candidate = await prisma.matchCandidate.create({
      data: {
        matchRunId: run.id,
        candidateType: "transport_vehicle",
        candidateVehicleId: v.id,
        candidateOrganisationId: v.organisationId,
        score: suitabilityScore * (v.verificationStatus === "verified" ? 1 : 0.6),
        scoreExplanation:
          warnings.length > 0
            ? warnings.join(" ")
            : "Vehicle appears suitable for stated requirements.",
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
  notes?: string,
  options?: { participantConfirmed?: boolean; adminOverride?: boolean }
) {
  const existing = await prisma.matchCandidate.findUnique({
    where: { id: candidateId },
    include: { matchRun: true },
  });
  if (!existing) throw new Error("NOT_FOUND");

  if (platformPatternsConfig.matchParticipantConfirmRequired) {
    if (!options?.participantConfirmed && !options?.adminOverride) {
      throw new Error("PARTICIPANT_CONFIRMATION_REQUIRED");
    }
  }

  await assertAgentRunAllowsAction({ matchRunId: existing.matchRunId });

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
      participantConfirmed: options?.participantConfirmed ?? false,
      participantConfirmedAt: options?.participantConfirmed
        ? new Date()
        : undefined,
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
