import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { checkConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";

import { updateDeliveryStatus } from "./delivery-service";

export async function recordHandover(
  orderId: string,
  driverUserId: string,
  input: {
    checklist: Record<string, unknown>;
    photoUrl?: string;
    recipientName?: string;
    notes?: string;
  }
) {
  const assignment = await prisma.foodDeliveryAssignment.findUnique({
    where: { orderId },
    include: { order: true },
  });
  if (!assignment || assignment.driverUserId !== driverUserId) {
    throw new Error("FORBIDDEN");
  }

  if (input.photoUrl) {
    const photoOk = await checkConsent({
      subjectUserId: assignment.order.participantId,
      scope: "foods.delivery_photo_share",
    });
    if (!photoOk) throw new Error("CONSENT_REQUIRED_PHOTO");
  }

  await prisma.foodDeliveryHandoverRecord.upsert({
    where: { assignmentId: assignment.id },
    create: {
      assignmentId: assignment.id,
      checklistJson: input.checklist as object,
      photoUrl: input.photoUrl,
      recipientName: input.recipientName,
      notes: input.notes,
      confirmedAt: new Date(),
    },
    update: {
      checklistJson: input.checklist as object,
      photoUrl: input.photoUrl,
      recipientName: input.recipientName,
      notes: input.notes,
      confirmedAt: new Date(),
    },
  });

  await updateDeliveryStatus(orderId, "handover_confirmed", driverUserId);

  await createAuditEvent({
    actorUserId: driverUserId,
    action: "foods.delivery.handover",
    entityType: "FoodDeliveryHandoverRecord",
    entityId: assignment.id,
    participantId: assignment.order.participantId,
  });

  return assignment;
}
