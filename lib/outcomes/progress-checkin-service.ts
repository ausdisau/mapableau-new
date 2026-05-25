import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { recordParticipantTimelineEvent } from "@/lib/timeline/timeline-service";

export async function addOutcomeCheckin(params: {
  goalId: string;
  submittedById: string;
  narrativeUpdate?: string;
  progressRating?: number;
  barriers?: string;
  nextSteps?: string;
  participantVisible?: boolean;
}) {
  const goal = await prisma.outcomeGoal.findUnique({ where: { id: params.goalId } });
  if (!goal) throw new Error("GOAL_NOT_FOUND");

  const checkin = await prisma.outcomeCheckin.create({
    data: {
      goalId: params.goalId,
      submittedById: params.submittedById,
      narrativeUpdate: params.narrativeUpdate,
      progressRating: params.progressRating,
      barriers: params.barriers,
      nextSteps: params.nextSteps,
      participantVisible: params.participantVisible ?? true,
    },
  });

  await createAuditEvent({
    actorUserId: params.submittedById,
    action: "outcome_checkin.created",
    entityType: "OutcomeCheckin",
    entityId: checkin.id,
    participantId: goal.participantId,
  });

  await recordParticipantTimelineEvent({
    participantId: goal.participantId,
    eventType: "outcome_checkin_added",
    title: "Progress check-in",
    summary: params.narrativeUpdate ?? "Progress updated",
    sourceType: "OutcomeCheckin",
    sourceId: checkin.id,
  });

  return checkin;
}
