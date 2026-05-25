import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function reportFoodSafetyIssue(input: {
  orderId: string;
  reportedById: string;
  category: string;
  description: string;
  createsDispute?: boolean;
}) {
  const order = await prisma.foodOrder.findUniqueOrThrow({ where: { id: input.orderId } });
  const event = await prisma.foodSafetyEvent.create({
    data: {
      orderId: input.orderId,
      reportedById: input.reportedById,
      category: input.category,
      description: input.description,
      createsDispute: input.createsDispute ?? false,
    },
  });
  if (input.createsDispute) {
    await prisma.foodOrder.update({ where: { id: input.orderId }, data: { status: "disputed", paymentStatus: "blocked" } });
    await prisma.foodDispute.create({
      data: { orderId: input.orderId, openedById: input.reportedById, reason: input.description },
    });
  }
  await createAuditEvent({
    actorUserId: input.reportedById,
    action: "foods.safety.reported",
    entityType: "FoodSafetyEvent",
    entityId: event.id,
    participantId: order.participantId,
    organisationId: order.organisationId,
  });
  return event;
}

export async function resolveFoodDispute(input: { disputeId: string; actorUserId: string; resolution: string }) {
  const dispute = await prisma.foodDispute.update({
    where: { id: input.disputeId },
    data: { status: "resolved", resolution: input.resolution, resolvedAt: new Date() },
    include: { order: true },
  });
  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "foods.dispute.resolved",
    entityType: "FoodDispute",
    entityId: dispute.id,
    participantId: dispute.order.participantId,
    organisationId: dispute.order.organisationId,
  });
  return dispute;
}
