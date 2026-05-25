import type { FoodOrderItemCostType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { createDraftInvoice } from "@/lib/billing-core/invoice-service";
import { prisma } from "@/lib/prisma";

const COST_TYPE_LABELS: Record<FoodOrderItemCostType, string> = {
  food_item: "Food items",
  preparation: "Meal preparation",
  delivery: "Delivery",
  support_time: "Support time",
  packaging: "Packaging",
  other: "Other food support",
};

export function buildFoodInvoiceLines(
  items: Array<{ costType: FoodOrderItemCostType | string; titleSnapshot?: string; totalCents: number }>
) {
  const grouped = new Map<string, number>();
  for (const item of items) grouped.set(item.costType, (grouped.get(item.costType) ?? 0) + item.totalCents);
  return Array.from(grouped.entries()).map(([costType, amount]) => ({
    description: `MapAble Foods - ${COST_TYPE_LABELS[costType as FoodOrderItemCostType] ?? costType} (NDIS review required)`,
    quantity: 1,
    unitAmountCents: amount,
    totalCents: amount,
    amountCents: amount,
    costType,
    ndisClaimable: false,
    gstApplicable: false,
    metadata: { costType, ndisReviewRequired: true },
  }));
}

export async function createFoodInvoicePlaceholder(params: { orderId: string; actorUserId: string }) {
  const order = await prisma.foodOrder.findUnique({ where: { id: params.orderId }, include: { items: true } });
  if (!order) throw new Error("NOT_FOUND");
  if (["cancelled", "disputed"].includes(order.status)) throw new Error("INVOICE_BLOCKED");

  const lineItems = buildFoodInvoiceLines(order.items);
  const invoice = await createDraftInvoice(order.participantId, {
    providerId: order.organisationId,
    serviceType: "foods",
    ndisClaimable: false,
    lineItems: lineItems.map((line) => ({
      description: line.description,
      quantity: 1,
      unitAmountCents: line.unitAmountCents,
      gstApplicable: false,
      metadata: line.metadata,
    })),
  });

  const link = await prisma.foodInvoiceLink.create({
    data: {
      orderId: order.id,
      billingInvoiceId: invoice.id,
      status: "created",
      lineItemSummary: { lines: lineItems, xero: { sync: "placeholder", sourceOfTruth: "mapable" } } as any,
    },
  });

  await prisma.foodOrder.update({ where: { id: order.id }, data: { invoiceStatus: "created" } });
  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "foods.invoice.created",
    entityType: "FoodInvoiceLink",
    entityId: link.id,
    participantId: order.participantId,
    organisationId: order.organisationId,
    metadata: { billingInvoiceId: invoice.id, serviceType: "foods" },
  });

  return { invoice, link };
}

export async function createFoodInvoice(input: { orderId: string; actorUserId: string }) {
  return createFoodInvoicePlaceholder(input);
}

export async function requestPlanManagerReview(params: { orderId: string; actorUserId: string }) {
  const link = await prisma.foodInvoiceLink.findFirst({ where: { orderId: params.orderId }, include: { order: true } });
  const order = await prisma.foodOrder.update({ where: { id: params.orderId }, data: { invoiceStatus: "under_review" } });
  if (link) {
    await prisma.foodInvoiceLink.update({ where: { id: link.id }, data: { status: "under_review" } });
  }
  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "foods.invoice.plan_manager_review_requested",
    entityType: "FoodOrder",
    entityId: order.id,
    participantId: order.participantId,
    organisationId: order.organisationId,
  });
  return order;
}
