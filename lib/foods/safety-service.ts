import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function reportFoodIssue(params: {
  orderId?: string;
  reporterId: string;
  description: string;
  severity?: "low" | "medium" | "high" | "critical";
}) {
  const event = await prisma.foodSafetyEvent.create({
    data: {
      orderId: params.orderId,
      reporterId: params.reporterId,
      description: params.description,
      severity: params.severity ?? "medium",
    },
  });

  await createAuditEvent({
    actorUserId: params.reporterId,
    action: "foods.safety.reported",
    entityType: "FoodSafetyEvent",
    entityId: event.id,
    metadata: { orderId: params.orderId, severity: params.severity },
  });

  return event;
}

export async function resolveDispute(
  orderId: string,
  adminUserId: string,
  resolution: string
) {
  const dispute = await prisma.foodDispute.findFirst({
    where: { orderId, status: "open" },
    orderBy: { createdAt: "desc" },
  });
  if (!dispute) throw new Error("DISPUTE_NOT_FOUND");

  await prisma.foodDispute.update({
    where: { id: dispute.id },
    data: { status: "resolved", resolution },
  });

  await createAuditEvent({
    actorUserId: adminUserId,
    action: "foods.dispute.resolved",
    entityType: "FoodOrder",
    entityId: orderId,
    metadata: { disputeId: dispute.id, resolution },
  });

  return dispute;
}
