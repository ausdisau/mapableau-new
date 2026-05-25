import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { checkConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";

export async function recordFoodHandover(params: {
  assignmentId: string;
  actorUserId?: string;
  recordedById?: string;
  checklist: Record<string, unknown>;
  photoUrl?: string;
  notes?: string;
}) {
  const actorUserId = params.actorUserId ?? params.recordedById;
  if (!actorUserId) throw new Error("RECORDED_BY_REQUIRED");

  const assignment = await prisma.foodDeliveryAssignment.findUnique({
    where: { id: params.assignmentId },
    include: { order: true },
  });
  if (!assignment) throw new Error("NOT_FOUND");

  const photoConsent =
    !params.photoUrl ||
    (await checkConsent({
      subjectUserId: assignment.order.participantId,
      grantedToUserId: actorUserId,
      scope: "foods.delivery_photo_share",
    }));

  if (params.photoUrl && !photoConsent) throw new Error("PHOTO_CONSENT_REQUIRED");

  const record = await prisma.foodDeliveryHandoverRecord.upsert({
    where: { assignmentId: assignment.id },
    create: {
      assignmentId: assignment.id,
      checklist: params.checklist as any,
      photoUrl: params.photoUrl,
      photoConsent: Boolean(params.photoUrl),
      notes: params.notes,
      recordedById: actorUserId,
    },
    update: {
      checklist: params.checklist as any,
      photoUrl: params.photoUrl,
      photoConsent: Boolean(params.photoUrl),
      notes: params.notes,
      recordedById: actorUserId,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "foods.delivery.handover_recorded",
    entityType: "FoodDeliveryHandoverRecord",
    entityId: record.id,
    participantId: assignment.order.participantId,
    organisationId: assignment.organisationId,
    metadata: { hasPhoto: Boolean(params.photoUrl) },
  });

  return record;
}