import type {
  CareAllocationAutonomyTier,
  CareAllocationProposalStatus,
  CareAllocationTrigger,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { assignWorkerToCareBooking } from "@/lib/care/care-assignment-service";
import { recordCareBookingEvent } from "@/lib/care/care-booking-service";
import { assertProviderOrgAccess } from "@/lib/care/access-control";
import { allocationConfig, resolveAutonomyTier } from "@/lib/config/allocation";
import { runAiCareMatch } from "@/lib/ai-matching/ai-match-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { runCareWorkerMatch } from "@/lib/matching/matching-service";
import { prisma } from "@/lib/prisma";
import { assertCareAllocationCapability } from "@/lib/care-allocation/governance";
import {
  evaluateAllocationGates,
  proposalStatusFromGate,
} from "@/lib/care-allocation/gates";
import { runSmartContract } from "@/lib/contracts/contract-runner";

export async function runCareAllocation(params: {
  careBookingId: string;
  actorUser: CurrentUser;
  trigger: CareAllocationTrigger;
  autonomyTier?: CareAllocationAutonomyTier;
}) {
  if (!allocationConfig.careAllocationEnabled) {
    return { skipped: true, reason: "CARE_ALLOCATION_DISABLED" };
  }

  assertCareAllocationCapability("recommend_workers");

  const booking = await prisma.careBooking.findUnique({
    where: { id: params.careBookingId },
    include: {
      careRequest: true,
      riskFlags: { where: { active: true } },
    },
  });
  if (!booking) throw new Error("NOT_FOUND");
  await assertProviderOrgAccess(params.actorUser, booking.organisationId);

  const autonomyTier =
    params.autonomyTier ??
    (resolveAutonomyTier(null) === "conditional_auto"
      ? "conditional_auto"
      : "recommend_only");

  const run = await prisma.careAllocationRun.create({
    data: {
      careBookingId: booking.id,
      careRequestId: booking.careRequestId,
      organisationId: booking.organisationId,
      participantId: booking.participantId,
      trigger: params.trigger,
      status: "running",
      autonomyTier,
      requestedById: params.actorUser.id,
    },
  });

  try {
    const matchResult = await runCareWorkerMatch(
      booking.careRequestId,
      params.actorUser.id
    );
    if ("skipped" in matchResult && matchResult.skipped) {
      await prisma.careAllocationRun.update({
        where: { id: run.id },
        data: {
          status: "failed",
          errorMessage: "Matching engine disabled",
          completedAt: new Date(),
        },
      });
      return { run, proposals: [], skipped: true };
    }

    let aiMatchRunId: string | undefined;
    const aiResult = await runAiCareMatch(
      booking.careRequestId,
      params.actorUser.id
    );
    if (!("skipped" in aiResult) && aiResult.aiRun) {
      aiMatchRunId = aiResult.aiRun.id;
    }

    const matchRunId =
      "run" in matchResult && matchResult.run ? matchResult.run.id : undefined;

    await prisma.careAllocationRun.update({
      where: { id: run.id },
      data: { matchRunId, aiMatchRunId },
    });

    const candidates = await prisma.matchCandidate.findMany({
      where: {
        matchRun: { careRequestId: booking.careRequestId },
        candidateWorkerId: { not: null },
      },
      orderBy: { score: "desc" },
      take: allocationConfig.maxProposalsPerRun,
    });

    const startAt =
      booking.scheduledStartAt ?? booking.careRequest.preferredDate ?? new Date();
    const endAt =
      booking.scheduledEndAt ??
      new Date(startAt.getTime() + 2 * 60 * 60 * 1000);

    const proposals = [];
    let rank = 0;

    for (const candidate of candidates) {
      if (!candidate.candidateWorkerId) continue;
      rank += 1;

      let combinedScore = candidate.score;
      if (aiMatchRunId) {
        const aiCand = await prisma.aiMatchCandidate.findFirst({
          where: {
            aiMatchRunId,
            matchCandidateId: candidate.id,
          },
        });
        if (aiCand) combinedScore = aiCand.combinedScore;
      }

      const gateEval = await evaluateAllocationGates({
        careBookingId: booking.id,
        organisationId: booking.organisationId,
        participantId: booking.participantId,
        careRequestId: booking.careRequestId,
        workerProfileId: candidate.candidateWorkerId,
        tasks: booking.tasks,
        scheduledStart: startAt,
        scheduledEnd: endAt,
        actorUserId: params.actorUser.id,
        autonomyTier,
        combinedScore,
        aiMatchRunId,
        activeRiskFlags: booking.riskFlags.map((f) => ({
          flagType: f.flagType,
          severity: f.severity,
        })),
      });

      const status = proposalStatusFromGate(gateEval.gateResult, rank);

      const proposal = await prisma.careAllocationProposal.create({
        data: {
          allocationRunId: run.id,
          workerProfileId: candidate.candidateWorkerId,
          matchCandidateId: candidate.id,
          rank,
          combinedScore,
          gateResult: gateEval.gateResult,
          gateSummary: gateEval.findings,
          status,
        },
      });
      proposals.push(proposal);
    }

    const autoEligible = proposals.filter((p) => p.status === "auto_eligible");
    const tier = resolveAutonomyTier(
      autonomyTier === "conditional_auto" ? "conditional_auto" : "recommend_only"
    );

    if (
      tier === "conditional_auto" &&
      autoEligible.length === 1 &&
      autonomyTier === "conditional_auto"
    ) {
      assertCareAllocationCapability("conditional_auto_assign");
      await executeAllocationProposal({
        proposalId: autoEligible[0]!.id,
        actorUser: params.actorUser,
        decision: "auto_executed",
        autonomyTier: "conditional_auto",
        skipStatusCheck: true,
      });
    } else if (autoEligible.length > 1) {
      await prisma.careAllocationProposal.updateMany({
        where: {
          id: { in: autoEligible.map((p) => p.id) },
        },
        data: { status: "review_required" },
      });
    }

    await prisma.careAllocationRun.update({
      where: { id: run.id },
      data: { status: "completed", completedAt: new Date() },
    });

    await createAuditEvent({
      actorUserId: params.actorUser.id,
      action: "care_allocation.run_completed",
      entityType: "CareAllocationRun",
      entityId: run.id,
      participantId: booking.participantId,
      metadata: { proposalCount: proposals.length },
    });

    await recordCareBookingEvent({
      careBookingId: booking.id,
      eventType: "allocation_run_completed",
      title: `Worker allocation suggestions (${proposals.length})`,
      actorUserId: params.actorUser.id,
      metadata: { allocationRunId: run.id },
    });

    return {
      run: await prisma.careAllocationRun.findUnique({
        where: { id: run.id },
        include: { proposals: { orderBy: { rank: "asc" } } },
      }),
      proposals,
    };
  } catch (e) {
    await prisma.careAllocationRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        errorMessage: e instanceof Error ? e.message : "Unknown error",
        completedAt: new Date(),
      },
    });
    throw e;
  }
}

export async function executeAllocationProposal(params: {
  proposalId: string;
  actorUser: CurrentUser;
  decision: "approved" | "auto_executed" | "override";
  autonomyTier: CareAllocationAutonomyTier;
  notes?: string;
  skipStatusCheck?: boolean;
  alternateWorkerProfileId?: string;
}) {
  const proposal = await prisma.careAllocationProposal.findUnique({
    where: { id: params.proposalId },
    include: {
      allocationRun: { include: { careBooking: true } },
      workerProfile: true,
    },
  });
  if (!proposal) throw new Error("NOT_FOUND");

  const booking = proposal.allocationRun.careBooking;
  await assertProviderOrgAccess(params.actorUser, booking.organisationId);

  const allowedStatuses: CareAllocationProposalStatus[] = params.skipStatusCheck
    ? ["auto_eligible", "approved", "review_required", "recommended"]
    : ["approved", "review_required", "recommended", "auto_eligible"];

  if (!allowedStatuses.includes(proposal.status)) {
    throw new Error("PROPOSAL_NOT_EXECUTABLE");
  }

  const workerProfileId =
    params.alternateWorkerProfileId ?? proposal.workerProfileId;

  const startAt =
    booking.scheduledStartAt ?? new Date();
  const endAt =
    booking.scheduledEndAt ??
    new Date(startAt.getTime() + 2 * 60 * 60 * 1000);

  const gateEval = await evaluateAllocationGates({
    careBookingId: booking.id,
    organisationId: booking.organisationId,
    participantId: booking.participantId,
    careRequestId: proposal.allocationRun.careRequestId,
    workerProfileId,
    tasks: booking.tasks,
    scheduledStart: startAt,
    scheduledEnd: endAt,
    actorUserId: params.actorUser.id,
    autonomyTier: params.autonomyTier,
    combinedScore: proposal.combinedScore,
    aiMatchRunId: proposal.allocationRun.aiMatchRunId,
    activeRiskFlags: await prisma.careRiskFlag
      .findMany({
        where: {
          careBookingId: booking.id,
          active: true,
        },
      })
      .then((rows) =>
        rows.map((f) => ({ flagType: f.flagType, severity: f.severity }))
      ),
  });

  if (gateEval.gateResult === "blocked" && !params.skipStatusCheck) {
    throw new Error("ALLOCATION_GATE_BLOCKED");
  }

  await runSmartContract({
    contractCode: "CARE_ALLOCATION_V1",
    actorUserId: params.actorUser.id,
    entityType: "CareBooking",
    entityId: booking.id,
    participantId: booking.participantId,
    context: {
      workerVerified: true,
      providerVerified: true,
      hasScheduleConflict: false,
    },
  });

  const assignResult = await assignWorkerToCareBooking({
    careBookingId: booking.id,
    workerProfileId,
    actorUser: params.actorUser,
    startAt,
    endAt,
  });

  await prisma.careAllocationProposal.update({
    where: { id: proposal.id },
    data: { status: "executed" },
  });

  await prisma.careAllocationDecision.create({
    data: {
      proposalId: proposal.id,
      decidedById:
        params.decision === "auto_executed" ? null : params.actorUser.id,
      decision: params.decision,
      autonomyTier: params.autonomyTier,
      notes: params.notes,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUser.id,
    action: "care_allocation.executed",
    entityType: "CareAllocationProposal",
    entityId: proposal.id,
    participantId: booking.participantId,
    metadata: {
      workerProfileId,
      decision: params.decision,
    },
  });

  return { proposal, assignResult };
}

export async function approveAllocationProposal(
  proposalId: string,
  actorUser: CurrentUser,
  notes?: string
) {
  const proposal = await prisma.careAllocationProposal.update({
    where: { id: proposalId },
    data: { status: "approved" },
    include: { allocationRun: true },
  });

  return executeAllocationProposal({
    proposalId: proposal.id,
    actorUser,
    decision: "approved",
    autonomyTier: proposal.allocationRun.autonomyTier,
    notes,
  });
}

export async function rejectAllocationProposal(
  proposalId: string,
  actorUser: CurrentUser,
  notes?: string
) {
  const proposal = await prisma.careAllocationProposal.findUnique({
    where: { id: proposalId },
    include: { allocationRun: true },
  });
  if (!proposal) throw new Error("NOT_FOUND");
  await assertProviderOrgAccess(
    actorUser,
    proposal.allocationRun.organisationId
  );

  await prisma.careAllocationProposal.update({
    where: { id: proposalId },
    data: { status: "rejected" },
  });

  await prisma.careAllocationDecision.create({
    data: {
      proposalId,
      decidedById: actorUser.id,
      decision: "rejected",
      autonomyTier: proposal.allocationRun.autonomyTier,
      notes,
    },
  });

  await createAuditEvent({
    actorUserId: actorUser.id,
    action: "care_allocation.rejected",
    entityType: "CareAllocationProposal",
    entityId: proposalId,
  });

  return { ok: true };
}

export async function listAllocationProposals(params: {
  organisationId: string;
  status?: CareAllocationProposalStatus;
  careBookingId?: string;
}) {
  return prisma.careAllocationProposal.findMany({
    where: {
      allocationRun: {
        organisationId: params.organisationId,
        careBookingId: params.careBookingId,
      },
      status: params.status,
    },
    include: {
      workerProfile: { select: { id: true, displayName: true } },
      allocationRun: {
        select: {
          id: true,
          careBookingId: true,
          autonomyTier: true,
          createdAt: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { rank: "asc" }],
    take: 50,
  });
}
