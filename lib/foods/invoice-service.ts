import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function createFoodInvoice(orderId: string, actorUserId: string) {
  const order = await prisma.foodOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error("NOT_FOUND");

  const lineDescriptions: Record<string, string> = {
    food_item: "Food items",
    preparation: "Meal preparation",
    delivery: "Delivery fee",
    support_time: "Support worker time",
    packaging: "Packaging",
    other: "Other fees",
  };

  const grouped = new Map<string, number>();
  for (const item of order.items) {
    const key = item.itemCostType;
    grouped.set(key, (grouped.get(key) ?? 0) + item.totalAmount);
  }
  if (order.deliveryFeeAmount > 0) {
    grouped.set("delivery", (grouped.get("delivery") ?? 0) + order.deliveryFeeAmount);
  }
  if (order.preparationFeeAmount > 0) {
    grouped.set(
      "preparation",
      (grouped.get("preparation") ?? 0) + order.preparationFeeAmount
    );
  }
  if (order.supportFeeAmount > 0) {
    grouped.set("support_time", (grouped.get("support_time") ?? 0) + order.supportFeeAmount);
  }

  const invoiceLines = [...grouped.entries()].map(([costType, amount]) => ({
    description: lineDescriptions[costType] ?? costType,
    amountCents: amount,
    costType,
    ndisReviewStatus: "review_required",
  }));

  const link = await prisma.foodInvoiceLink.create({
    data: {
      orderId,
      xeroSyncStatus: "pending",
      ndisReviewStatus: "review_required",
    },
  });

  await prisma.foodOrder.update({
    where: { id: orderId },
    data: { invoiceStatus: "draft" },
  });

  await createAuditEvent({
    actorUserId,
    action: "foods.invoice.created",
    entityType: "FoodInvoiceLink",
    entityId: link.id,
    participantId: order.participantId,
    metadata: { lines: invoiceLines },
  });

  return { invoiceLink: link, lines: invoiceLines, xeroSyncStatus: "placeholder_pending" };
}

export async function requestPlanManagerReview(orderId: string, actorUserId: string) {
  const order = await prisma.foodOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("NOT_FOUND");

  await createAuditEvent({
    actorUserId,
    action: "foods.invoice.plan_manager_review_requested",
    entityType: "FoodOrder",
    entityId: orderId,
    participantId: order.participantId,
  });

  return {
    status: "review_required",
    message: "NDIS pricing/claim validation is a reference layer only — review required.",
  };
}
