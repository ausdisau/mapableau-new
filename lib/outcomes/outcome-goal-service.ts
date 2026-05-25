import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { requireModuleEnabled } from "@/lib/feature-flags/require-module";
import { recordParticipantTimelineEvent } from "@/lib/timeline/timeline-service";

import { canViewParticipantOutcomes } from "./outcome-access-policy";
import type { CurrentUser } from "@/lib/auth/current-user";

export async function createOutcomeGoal(params: {
  participantId: string;
  goalText: string;
  goalArea?: string;
  source?: "participant_entered" | "support_coordinator" | "imported";
  visibility?: string;
  createdById?: string;
}) {
  await requireModuleEnabled("outcomes_tracker_enabled");

  const goal = await prisma.outcomeGoal.create({
    data: {
      participantId: params.participantId,
      goalText: params.goalText,
      goalArea: params.goalArea,
      source: params.source ?? "participant_entered",
      visibility: params.visibility ?? "participant_only",
      createdById: params.createdById,
    },
  });

  await createAuditEvent({
    actorUserId: params.createdById,
    action: "outcome_goal.created",
    entityType: "OutcomeGoal",
    entityId: goal.id,
    participantId: params.participantId,
  });

  await recordParticipantTimelineEvent({
    participantId: params.participantId,
    eventType: "goal_created",
    title: "Goal added",
    summary: params.goalText,
    sourceType: "OutcomeGoal",
    sourceId: goal.id,
  });

  return goal;
}

export async function listOutcomeGoals(
  participantId: string,
  viewer: CurrentUser
) {
  if (!(await canViewParticipantOutcomes(viewer, participantId))) {
    throw new Error("OUTCOMES_FORBIDDEN");
  }
  return prisma.outcomeGoal.findMany({
    where: { participantId },
    orderBy: { updatedAt: "desc" },
    include: { checkins: { take: 3, orderBy: { createdAt: "desc" } } },
  });
}

export async function getOutcomeGoal(id: string, viewer: CurrentUser) {
  const goal = await prisma.outcomeGoal.findUnique({
    where: { id },
    include: { checkins: true, progress: true, activityLinks: true },
  });
  if (!goal) return null;
  if (!(await canViewParticipantOutcomes(viewer, goal.participantId))) {
    throw new Error("OUTCOMES_FORBIDDEN");
  }
  return goal;
}
