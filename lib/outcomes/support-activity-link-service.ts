import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit/audit-event-service";

export async function linkSupportActivityToGoal(params: {
  goalId: string;
  activityType: string;
  activityId: string;
  actorUserId: string;
}) {
  const link = await prisma.supportActivityOutcomeLink.create({
    data: {
      goalId: params.goalId,
      activityType: params.activityType,
      activityId: params.activityId,
    },
  });

  const goal = await prisma.outcomeGoal.findUnique({ where: { id: params.goalId } });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "outcome_activity.linked",
    entityType: "SupportActivityOutcomeLink",
    entityId: link.id,
    participantId: goal?.participantId,
  });

  return link;
}
