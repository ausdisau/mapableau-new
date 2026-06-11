import type { MapAbleUserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { assertParticipantAccess } from "./access-service";
import { getCoordinateAIEngine } from "./ai/engine";
import { shouldEscalateToHumanReview } from "./ai/escalation";
import { logCoordinateAudit } from "./audit-service";
import { createHumanReviewTask } from "./review-service";
import { COORDINATE_AUDIT_ACTIONS } from "./types";

export async function extractGoalsForPlan(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  planId: string;
  participantId: string;
}) {
  await assertParticipantAccess(params);

  const plan = await prisma.coordinateNdisPlan.findUnique({
    where: { id: params.planId },
  });
  if (!plan || plan.participantId !== params.participantId) {
    throw new Error("NOT_FOUND");
  }

  const summary = plan.summaryJson as {
    headline?: string;
    keyPoints?: string[];
  };

  const engine = getCoordinateAIEngine();
  const { goals, meta } = engine.extractGoals(summary);
  const escalation = shouldEscalateToHumanReview({
    confidence: meta.confidence,
  });

  const created = [];
  for (const [index, goal] of goals.entries()) {
    const row = await prisma.coordinatePlanGoal.create({
      data: {
        planId: plan.id,
        title: goal.title,
        description: goal.description,
        category: goal.category,
        priority: index + 1,
        status: escalation.escalate ? "proposed" : "confirmed",
        sourceSpan: goal.sourceSpan,
        confidence: goal.confidence,
        reason: goal.reason,
      },
    });
    created.push(row);
  }

  if (escalation.escalate) {
    await createHumanReviewTask({
      participantId: params.participantId,
      taskType: escalation.taskType,
      summary: "Confirm AI-extracted NDIS goals",
      payloadJson: { planId: plan.id, goalIds: created.map((g) => g.id) },
      sourceEntityType: "CoordinateNdisPlan",
      sourceEntityId: plan.id,
      confidence: meta.confidence,
      reason: escalation.reason,
    });
  }

  await logCoordinateAudit({
    action: COORDINATE_AUDIT_ACTIONS.GOALS_EXTRACTED,
    actorUserId: params.actorId,
    actorRole: params.actorRole,
    entityType: "CoordinateNdisPlan",
    entityId: plan.id,
    participantId: params.participantId,
    metadata: { count: created.length, confidence: meta.confidence },
  });

  return { goals: created, meta, escalation };
}

export async function listGoalsForPlan(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  planId: string;
  participantId: string;
}) {
  await assertParticipantAccess(params);

  const plan = await prisma.coordinateNdisPlan.findUnique({
    where: { id: params.planId },
  });
  if (!plan || plan.participantId !== params.participantId) {
    throw new Error("NOT_FOUND");
  }

  return prisma.coordinatePlanGoal.findMany({
    where: { planId: params.planId },
    orderBy: { priority: "asc" },
  });
}

export async function listSupportActionsForPlan(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  planId: string;
  participantId: string;
}) {
  await assertParticipantAccess(params);

  const plan = await prisma.coordinateNdisPlan.findUnique({
    where: { id: params.planId },
  });
  if (!plan || plan.participantId !== params.participantId) {
    throw new Error("NOT_FOUND");
  }

  return prisma.coordinateSupportAction.findMany({
    where: { planId: params.planId },
    orderBy: { createdAt: "asc" },
    include: { goal: true },
  });
}

export async function confirmGoal(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  goalId: string;
  participantId: string;
}) {
  await assertParticipantAccess(params);

  const goal = await prisma.coordinatePlanGoal.findUnique({
    where: { id: params.goalId },
    include: { plan: true },
  });
  if (!goal || goal.plan.participantId !== params.participantId) {
    throw new Error("NOT_FOUND");
  }

  return prisma.coordinatePlanGoal.update({
    where: { id: params.goalId },
    data: { status: "confirmed" },
  });
}

export async function createSupportAction(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  planId: string;
  participantId: string;
  title: string;
  goalId?: string;
  steps?: string[];
}) {
  await assertParticipantAccess(params);

  const plan = await prisma.coordinateNdisPlan.findUnique({
    where: { id: params.planId },
  });
  if (!plan || plan.participantId !== params.participantId) {
    throw new Error("NOT_FOUND");
  }

  return prisma.coordinateSupportAction.create({
    data: {
      planId: params.planId,
      goalId: params.goalId,
      title: params.title,
      stepsJson: params.steps ?? [],
      status: "proposed",
    },
  });
}

export async function approveSupportAction(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  actionId: string;
  participantId: string;
}) {
  await assertParticipantAccess(params);

  const action = await prisma.coordinateSupportAction.findUnique({
    where: { id: params.actionId },
    include: { plan: true },
  });
  if (!action || action.plan.participantId !== params.participantId) {
    throw new Error("NOT_FOUND");
  }

  const updated = await prisma.coordinateSupportAction.update({
    where: { id: params.actionId },
    data: { status: "approved" },
  });

  await logCoordinateAudit({
    action: COORDINATE_AUDIT_ACTIONS.ACTION_APPROVED,
    actorUserId: params.actorId,
    actorRole: params.actorRole,
    entityType: "CoordinateSupportAction",
    entityId: updated.id,
    participantId: params.participantId,
  });

  return updated;
}

export async function mapGoalToAction(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  actionId: string;
  goalId: string;
  participantId: string;
}) {
  await assertParticipantAccess(params);

  const action = await prisma.coordinateSupportAction.findUnique({
    where: { id: params.actionId },
    include: { plan: true },
  });
  if (!action || action.plan.participantId !== params.participantId) {
    throw new Error("NOT_FOUND");
  }

  return prisma.coordinateSupportAction.update({
    where: { id: params.actionId },
    data: { goalId: params.goalId },
  });
}
