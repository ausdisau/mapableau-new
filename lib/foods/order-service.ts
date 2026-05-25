import type { FoodSubstitutionPolicy } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

import { getOrCreateCart } from "./cart-service";
import { computeOrderTotals, orderBlocksPayment, type OrderLineInput } from "./order-totals";
import { privacySafeOrderNotification } from "./notification-copy";
import { notifyFoodsParticipant } from "./foods-notification-service";

export async function checkoutOrder(
  participantId: string,
  input: {
    deliveryAddressFull: string;
    deliveryAddressSuburb: string;
    deliveryAddressId?: string;
    deliveryWindowStart: Date;
    deliveryWindowEnd: Date;
    handoverInstructions?: Record<string, unknown>;
    substitutionPolicy?: FoodSubstitutionPolicy;
    allergenAcknowledged: boolean;
    deliveryFeeAmount?: number;
    preparationFeeAmount?: number;
    supportFeeAmount?: number;
    nomineeId?: string;
  }
) {
  const cart = await getOrCreateCart(participantId);
  if (!cart.items.length || !cart.vendorId) {
    throw new Error("CART_EMPTY");
  }

  const lines: OrderLineInput[] = cart.items.map((item) => ({
    productId: item.productId,
    titleSnapshot: item.product.title,
    quantity: item.quantity,
    unitAmount: item.product.priceAmount,
    itemCostType: "food_item",
    dietaryTagsSnapshot: item.product.dietaryTags,
    allergenTagsSnapshot: item.product.allergenTags,
  }));

  const totals = computeOrderTotals({
    lines,
    deliveryFeeAmount: input.deliveryFeeAmount,
    preparationFeeAmount: input.preparationFeeAmount,
    supportFeeAmount: input.supportFeeAmount,
  });

  const order = await prisma.foodOrder.create({
    data: {
      participantId,
      vendorId: cart.vendorId,
      nomineeId: input.nomineeId,
      status: "submitted",
      orderType: "one_off",
      subtotalAmount: totals.subtotalAmount,
      deliveryFeeAmount: totals.deliveryFeeAmount,
      preparationFeeAmount: totals.preparationFeeAmount,
      supportFeeAmount: totals.supportFeeAmount,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      deliveryAddressFull: input.deliveryAddressFull,
      deliveryAddressSuburb: input.deliveryAddressSuburb,
      deliveryAddressId: input.deliveryAddressId,
      deliveryWindowStart: input.deliveryWindowStart,
      deliveryWindowEnd: input.deliveryWindowEnd,
      handoverInstructionsJson: (input.handoverInstructions ?? {}) as object,
      substitutionPolicy: input.substitutionPolicy ?? "contact_first",
      allergenAcknowledged: input.allergenAcknowledged,
      items: {
        create: lines.map((l) => ({
          productId: l.productId,
          titleSnapshot: l.titleSnapshot,
          quantity: l.quantity,
          unitAmount: l.unitAmount,
          totalAmount: l.unitAmount * l.quantity,
          itemCostType: l.itemCostType,
          dietaryTagsSnapshot: l.dietaryTagsSnapshot ?? [],
          allergenTagsSnapshot: l.allergenTagsSnapshot ?? [],
        })),
      },
      events: {
        create: {
          eventType: "order_submitted",
          title: "Order submitted",
          actorUserId: participantId,
        },
      },
      delivery: {
        create: { status: "not_assigned" },
      },
    },
    include: { items: true, events: true, delivery: true },
  });

  await prisma.foodCartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.foodCart.update({
    where: { id: cart.id },
    data: { vendorId: null },
  });

  await createAuditEvent({
    actorUserId: participantId,
    action: "foods.order.checkout",
    entityType: "FoodOrder",
    entityId: order.id,
    participantId,
    metadata: { totalAmount: order.totalAmount },
  });

  await notifyFoodsParticipant(participantId, "orderUpdated", order.id);

  return order;
}

export async function listParticipantOrders(participantId: string) {
  return prisma.foodOrder.findMany({
    where: { participantId },
    orderBy: { createdAt: "desc" },
    include: { items: true, delivery: true },
  });
}

export async function getOrderById(orderId: string) {
  return prisma.foodOrder.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      events: { orderBy: { createdAt: "asc" } },
      delivery: { include: { trackingEvents: { orderBy: { createdAt: "asc" } } } },
      disputes: true,
    },
  });
}

export async function cancelOrder(orderId: string, actorUserId: string) {
  const order = await prisma.foodOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("NOT_FOUND");
  if (order.status === "cancelled") throw new Error("ALREADY_CANCELLED");

  const updated = await prisma.foodOrder.update({
    where: { id: orderId },
    data: { status: "cancelled", paymentStatus: "blocked" },
  });

  await prisma.foodOrderEvent.create({
    data: {
      orderId,
      eventType: "order_cancelled",
      title: "Order cancelled",
      actorUserId,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "foods.order.cancelled",
    entityType: "FoodOrder",
    entityId: orderId,
    participantId: order.participantId,
  });

  return updated;
}

export async function confirmDelivery(orderId: string, actorUserId: string) {
  const order = await prisma.foodOrder.update({
    where: { id: orderId },
    data: {
      deliveryStatus: "handover_confirmed",
      status: "completed",
    },
  });

  await prisma.foodDeliveryAssignment.updateMany({
    where: { orderId },
    data: { status: "handover_confirmed" },
  });

  await prisma.foodOrderEvent.create({
    data: {
      orderId,
      eventType: "delivery_confirmed",
      title: "Delivery confirmed by participant",
      actorUserId,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "foods.order.delivery_confirmed",
    entityType: "FoodOrder",
    entityId: orderId,
    participantId: order.participantId,
  });

  await notifyFoodsParticipant(
    order.participantId,
    "delivered",
    orderId
  );

  return order;
}

export async function disputeOrder(
  orderId: string,
  raisedById: string,
  reason: string
) {
  const order = await prisma.foodOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("NOT_FOUND");

  await prisma.foodDispute.create({
    data: { orderId, raisedById, reason, status: "open" },
  });

  const updated = await prisma.foodOrder.update({
    where: { id: orderId },
    data: { status: "disputed", deliveryStatus: "disputed", paymentStatus: "blocked" },
  });

  await prisma.foodOrderEvent.create({
    data: {
      orderId,
      eventType: "order_disputed",
      title: "Order disputed",
      actorUserId: raisedById,
    },
  });

  await createAuditEvent({
    actorUserId: raisedById,
    action: "foods.order.disputed",
    entityType: "FoodOrder",
    entityId: orderId,
    participantId: order.participantId,
    metadata: { reason },
  });

  return updated;
}

export function canCreatePaymentForOrder(order: {
  status: string;
  paymentStatus: string;
}): boolean {
  return !orderBlocksPayment(order.status, order.paymentStatus);
}

export async function providerConfirmOrder(orderId: string, actorUserId: string) {
  return transitionOrder(orderId, "confirmed", "Order confirmed by vendor", actorUserId);
}

export async function providerMarkPreparing(orderId: string, actorUserId: string) {
  return transitionOrder(orderId, "preparing", "Order is being prepared", actorUserId);
}

export async function providerMarkPacked(orderId: string, actorUserId: string) {
  return transitionOrder(orderId, "packed", "Order packed for delivery", actorUserId);
}

async function transitionOrder(
  orderId: string,
  status: "confirmed" | "preparing" | "packed",
  title: string,
  actorUserId: string
) {
  const order = await prisma.foodOrder.update({
    where: { id: orderId },
    data: { status },
  });

  await prisma.foodOrderEvent.create({
    data: { orderId, eventType: `order_${status}`, title, actorUserId },
  });

  await createAuditEvent({
    actorUserId,
    action: `foods.order.${status}`,
    entityType: "FoodOrder",
    entityId: orderId,
    participantId: order.participantId,
  });

  await notifyFoodsParticipant(order.participantId, "orderUpdated", orderId);

  return order;
}

export function buildAllergyWarningForOrder(
  items: Array<{ allergenTagsSnapshot: unknown }>,
  profileAllergens: string[]
): string[] {
  const warnings = new Set<string>();
  for (const item of items) {
    const tags = (item.allergenTagsSnapshot as string[]) ?? [];
    for (const tag of tags) {
      if (profileAllergens.some((a) => a.toLowerCase() === tag.toLowerCase())) {
        warnings.add(tag);
      }
    }
  }
  return [...warnings];
}
