import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  checkCoordinatorParticipantAccess,
} from "@/lib/access/consent-aware-access";
import { createNotificationEvent } from "@/lib/access/notification-event-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/mapable";

export async function createPlanReviewReminder(params: {
  coordinatorId: string;
  participantId: string;
  actorRole: UserRole;
  reviewDate: Date;
  title: string;
  notes?: string;
}) {
  const access = await checkCoordinatorParticipantAccess({
    coordinatorId: params.coordinatorId,
    participantId: params.participantId,
    actorRole: params.actorRole,
  });
  if (!access.allowed) throw new Error("CONSENT_REQUIRED");

  const reminder = await prisma.planReviewReminder.create({
    data: {
      participantId: params.participantId,
      coordinatorId: params.coordinatorId,
      reviewDate: params.reviewDate,
      title: params.title,
      notes: params.notes,
    },
  });

  await createAuditEvent({
    actorUserId: params.coordinatorId,
    action: "support_coordination.plan_review_reminder_created",
    entityType: "PlanReviewReminder",
    entityId: reminder.id,
    participantId: params.participantId,
  });

  await notifyUser(
    params.participantId,
    "profile",
    "Plan review reminder",
    params.title
  );
  await createNotificationEvent({
    userId: params.participantId,
    category: "plan_review",
    eventType: "plan_review_reminder",
    title: "Plan review reminder",
    body: params.title,
    participantId: params.participantId,
    entityType: "PlanReviewReminder",
    entityId: reminder.id,
  });

  return reminder;
}

export async function listPlanReviewReminders(
  participantId: string,
  coordinatorId: string,
  actorRole: UserRole
) {
  const access = await checkCoordinatorParticipantAccess({
    coordinatorId,
    participantId,
    actorRole,
  });
  if (!access.allowed) throw new Error("CONSENT_REQUIRED");

  return prisma.planReviewReminder.findMany({
    where: { participantId },
    orderBy: { reviewDate: "asc" },
  });
}
