import type { MapAbleUserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  assertParticipantAccess,
  resolveParticipantScope,
  resolveRoleView,
} from "./access-service";
import { getCoordinateAIEngine } from "./ai/engine";
import { shouldEscalateToHumanReview } from "./ai/escalation";
import { logCoordinateAudit } from "./audit-service";
import { createHumanReviewTask } from "./review-service";
import {
  COORDINATE_AUDIT_ACTIONS,
  COORDINATE_REASSURANCE,
  type CoordinateDashboardPayload,
} from "./types";

export async function getCoordinateDashboard(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  participantId?: string | null;
}): Promise<CoordinateDashboardPayload> {
  const participantId = resolveParticipantScope({
    actorId: params.actorId,
    actorRole: params.actorRole,
    requestedParticipantId: params.participantId,
  });
  await assertParticipantAccess({
    actorId: params.actorId,
    actorRole: params.actorRole,
    participantId,
  });

  const profile = await prisma.participantProfile.findUnique({
    where: { userId: participantId },
    select: { displayName: true, preferredName: true },
  });

  const plan = await prisma.coordinateNdisPlan.findFirst({
    where: { participantId, status: { in: ["draft", "active"] } },
    orderBy: { updatedAt: "desc" },
    include: { budgetCategories: true },
  });

  const [pendingReviews, pendingDrafts, activeRiskFlags] = await Promise.all([
    prisma.coordinateHumanReviewTask.count({
      where: { participantId, status: { in: ["open", "in_progress"] } },
    }),
    prisma.coordinateCommunicationDraft.count({
      where: {
        participantId,
        status: { in: ["draft", "pending_approval"] },
      },
    }),
    prisma.coordinateRiskFlag.count({
      where: { participantId, active: true },
    }),
  ]);

  let budgetUsedPercent: number | null = null;
  if (plan?.budgetCategories.length) {
    const totals = plan.budgetCategories.reduce(
      (acc, cat) => {
        acc.allocated += cat.allocatedCents;
        acc.used += cat.spentCents + cat.committedCents;
        return acc;
      },
      { allocated: 0, used: 0 },
    );
    if (totals.allocated > 0) {
      budgetUsedPercent = Math.round((totals.used / totals.allocated) * 100);
    }
  }

  return {
    roleView: resolveRoleView(params.actorRole),
    participantId,
    participantName: profile?.preferredName ?? profile?.displayName ?? "Participant",
    pendingReviews,
    pendingDrafts,
    activeRiskFlags,
    planStatus: plan?.status ?? null,
    budgetUsedPercent,
    reassurance: COORDINATE_REASSURANCE,
  };
}

export async function listCoordinatorParticipantsForDashboard(
  coordinatorId: string,
) {
  const rels = await prisma.supportCoordinatorRelationship.findMany({
    where: { coordinatorId, status: "active" },
  });
  const results = [];
  for (const rel of rels) {
    try {
      await assertParticipantAccess({
        actorId: coordinatorId,
        actorRole: "support_coordinator",
        participantId: rel.participantId,
      });
      const dash = await getCoordinateDashboard({
        actorId: coordinatorId,
        actorRole: "support_coordinator",
        participantId: rel.participantId,
      });
      results.push(dash);
    } catch {
      // skip participants without consent
    }
  }
  return results;
}

export async function uploadPlanSummary(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  participantId: string;
  planText: string;
  planStart?: Date;
  planEnd?: Date;
}) {
  await assertParticipantAccess(params);

  const engine = getCoordinateAIEngine();
  const { summary, meta } = engine.summarisePlan(params.planText);
  const escalation = shouldEscalateToHumanReview({
    confidence: meta.confidence,
  });

  const plan = await prisma.coordinateNdisPlan.create({
    data: {
      participantId: params.participantId,
      createdById: params.actorId,
      planStart: params.planStart,
      planEnd: params.planEnd,
      status: "draft",
      summaryJson: summary,
      aiConfidence: meta.confidence,
      aiReason: meta.reason,
      requiresReview: escalation.escalate,
    },
  });

  if (escalation.escalate) {
    await createHumanReviewTask({
      participantId: params.participantId,
      taskType: escalation.taskType,
      summary: "Review AI-generated plan summary before activation",
      payloadJson: { planId: plan.id, summary },
      sourceEntityType: "CoordinateNdisPlan",
      sourceEntityId: plan.id,
      confidence: meta.confidence,
      reason: escalation.reason,
    });
  }

  await logCoordinateAudit({
    action: COORDINATE_AUDIT_ACTIONS.PLAN_UPLOADED,
    actorUserId: params.actorId,
    actorRole: params.actorRole,
    entityType: "CoordinateNdisPlan",
    entityId: plan.id,
    participantId: params.participantId,
    metadata: { confidence: meta.confidence, engineId: meta.engineId },
  });

  return { plan, summary, meta, escalation };
}

export async function approvePlanSummary(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  planId: string;
  participantId: string;
}) {
  await assertParticipantAccess(params);

  const plan = await prisma.coordinateNdisPlan.update({
    where: { id: params.planId },
    data: {
      status: "active",
      requiresReview: false,
    },
  });

  await logCoordinateAudit({
    action: COORDINATE_AUDIT_ACTIONS.PLAN_SUMMARY_APPROVED,
    actorUserId: params.actorId,
    actorRole: params.actorRole,
    entityType: "CoordinateNdisPlan",
    entityId: plan.id,
    participantId: params.participantId,
  });

  return plan;
}

export async function getActivePlan(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  participantId: string;
}) {
  await assertParticipantAccess(params);
  return prisma.coordinateNdisPlan.findFirst({
    where: {
      participantId: params.participantId,
      status: { in: ["draft", "active"] },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      goals: { orderBy: { priority: "asc" } },
      budgetCategories: true,
      supportNeeds: true,
      supportActions: true,
      shortlistItems: { orderBy: { rank: "asc" } },
      riskFlags: { where: { active: true } },
    },
  });
}

export async function listPlans(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  participantId: string;
}) {
  await assertParticipantAccess(params);
  return prisma.coordinateNdisPlan.findMany({
    where: { participantId: params.participantId },
    orderBy: { updatedAt: "desc" },
  });
}
