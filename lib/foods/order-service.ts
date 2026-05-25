import type { FoodOrderStatus, FoodSubstitutionPolicy } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

import { calculateFoodOrderTotals, foodLineTotal } from "./order-totals";
import { notifyFoodUser } from "./notification-service";

const ORDER_TRANSITIONS: Record<FoodOrderStatus, FoodOrderStatus[]> = {
  draft: ["submitted", "cancelled"],
  submitted: ["confirmed", "cancelled", "disputed"],
  confirmed: ["preparing", "cancelled", "disputed"],
  preparing: ["packed", "cancelled", "disputed"],
  packed: ["assigned", "out_for_delivery", "cancelled", "disputed"],
  assigned: ["out_for_delivery", "cancelled", "disputed"],
  out_for_delivery: ["delivered", "disputed"],
  delivered: ["disputed", "refunded"],
  cancelled: [],
  disputed: ["refunded"],
  refunded: [],
};

export async function checkoutFoodCart(input: {
  participantId: string;
  vendorId: string;
  nomineeId?: string;
  deliveryAddressFull: string;
  deliveryAddressSuburb?: string;
  deliveryAddressState?: string;
  deliveryAddressPostcode?: string;
  deliveryInstructions?: string;
  deliveryWindowStart: Date;
  deliveryWindowEnd: Date;
  substitutionPolicy: FoodSubstitutionPolicy;
  allergenAcknowledged: boolean;
}) {
  const cart = await prisma.foodCart.findUniqueOrThrow({
    where: { participantId: input.participantId },
    include: { items: { include: { product: true } }, vendor: true },
  });
  if (!cart.items.length) throw new Error("Cart is empty");

  const vendorId = cart.vendorId ?? input.vendorId;
  const vendor = await prisma.foodVendor.findUniqueOrThrow({ where: { id: vendorId } });
  const allergyProfile = await prisma.foodAllergyProfile.findUnique({ where: { participantId: input.participantId } });
  const preferences = await prisma.foodParticipantPreference.findUnique({ where: { participantId: input.participantId } });

  const productLines = cart.items.map((item) => ({
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
    costType: item.costType,
  }));
  const feeLines = cart.items.flatMap((item) => [
    { quantity: item.quantity, unitPriceCents: item.product.preparationFeeCents, costType: "preparation" as const },
    { quantity: 1, unitPriceCents: item.product.deliveryFeeCents, costType: "delivery" as const },
    { quantity: item.quantity, unitPriceCents: item.product.supportFeeCents, costType: "support_time" as const },
  ]);
  const totals = calculateFoodOrderTotals([...productLines, ...feeLines]);

  const order = await prisma.foodOrder.create({
    data: {
      participantId: input.participantId,
      vendorId,
      organisationId: vendor.organisationId,
      nomineeId: input.nomineeId,
      orderType: "one_off",
      status: "submitted",
      substitutionPolicy: input.substitutionPolicy,
      deliveryAddressFull: input.deliveryAddressFull,
      deliveryAddressSuburb: input.deliveryAddressSuburb,
      deliveryAddressState: input.deliveryAddressState,
      deliveryAddressPostcode: input.deliveryAddressPostcode,
      deliveryInstructions: input.deliveryInstructions,
      deliveryWindowStart: input.deliveryWindowStart,
      deliveryWindowEnd: input.deliveryWindowEnd,
      allergenAcknowledged: input.allergenAcknowledged,
      dietarySnapshot: (preferences?.dietaryPreferences ?? []) as object,
      allergySnapshot: (allergyProfile?.allergens ?? []) as object,
      subtotalCents: totals.subtotalCents,
      preparationCents: totals.preparationCents,
      deliveryCents: totals.deliveryCents,
      supportCents: totals.supportCents,
      taxCents: totals.taxCents,
      totalCents: totals.totalCents,
      currency: "AUD",
      items: {
        create: ([
          ...cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            titleSnapshot: item.titleSnapshot,
            unitPriceCents: item.unitPriceCents,
            totalCents: foodLineTotal(item.quantity, item.unitPriceCents),
            costType: "food_item" as const,
            dietarySnapshot: item.dietarySnapshot,
            allergenSnapshot: item.allergenSnapshot,
          })),
          ...cart.items.flatMap((item) => [
            item.product.preparationFeeCents > 0
              ? {
                  productId: item.productId,
                  quantity: item.quantity,
                  titleSnapshot: `${item.titleSnapshot} preparation`,
                  unitPriceCents: item.product.preparationFeeCents,
                  totalCents: foodLineTotal(item.quantity, item.product.preparationFeeCents),
                  costType: "preparation" as const,
                }
              : null,
            item.product.deliveryFeeCents > 0
              ? {
                  productId: item.productId,
                  quantity: 1,
                  titleSnapshot: `${item.titleSnapshot} delivery`,
                  unitPriceCents: item.product.deliveryFeeCents,
                  totalCents: item.product.deliveryFeeCents,
                  costType: "delivery" as const,
                }
              : null,
            item.product.supportFeeCents > 0
              ? {
                  productId: item.productId,
                  quantity: item.quantity,
                  titleSnapshot: `${item.titleSnapshot} support time`,
                  unitPriceCents: item.product.supportFeeCents,
                  totalCents: foodLineTotal(item.quantity, item.product.supportFeeCents),
                  costType: "support_time" as const,
                }
              : null,
          ].filter(Boolean)),
        ] as any),
      },
      events: { create: { toStatus: "submitted", message: "Order submitted" } },
    },
    include: { items: true, vendor: true },
  });

  await prisma.foodCartItem.deleteMany({ where: { cartId: cart.id } });
  await createAuditEvent({
    actorUserId: input.participantId,
    action: "foods.order.checkout",
    entityType: "FoodOrder",
    entityId: order.id,
    participantId: input.participantId,
    organisationId: vendor.organisationId,
  });
  await notifyFoodUser(input.participantId, "orderUpdated");

  return order;
}

export async function updateFoodOrderStatus(input: {
  orderId: string;
  actorUserId: string;
  status: FoodOrderStatus;
  message?: string;
}) {
  const order = await prisma.foodOrder.findUniqueOrThrow({ where: { id: input.orderId } });
  if (!ORDER_TRANSITIONS[order.status].includes(input.status)) {
    throw new Error(`Invalid order transition ${order.status} -> ${input.status}`);
  }
  const updated = await prisma.foodOrder.update({ where: { id: order.id }, data: { status: input.status } });
  await prisma.foodOrderEvent.create({
    data: {
      orderId: order.id,
      fromStatus: order.status,
      toStatus: input.status,
      actorUserId: input.actorUserId,
      message: input.message,
    },
  });
  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "foods.order.status_updated",
    entityType: "FoodOrder",
    entityId: order.id,
    participantId: order.participantId,
    organisationId: order.organisationId,
    metadata: { status: input.status },
  });
  await notifyFoodUser(order.participantId, "orderUpdated");
  return updated;
}

export async function cancelFoodOrder(orderId: string, actorUserId: string) {
  return updateFoodOrderStatus({ orderId, actorUserId, status: "cancelled", message: "Order cancelled" });
}

export async function confirmFoodOrderDelivery(orderId: string, participantId: string) {
  const order = await prisma.foodOrder.update({
    where: { id: orderId, participantId },
    data: { participantConfirmedAt: new Date(), status: "delivered" },
  });
  await createAuditEvent({
    actorUserId: participantId,
    action: "foods.order.delivery_confirmed",
    entityType: "FoodOrder",
    entityId: order.id,
    participantId,
    organisationId: order.organisationId,
  });
  return order;
}

export async function disputeFoodOrder(orderId: string, participantId: string, reason: string) {
  const order = await prisma.foodOrder.update({
    where: { id: orderId, participantId },
    data: { participantDisputedAt: new Date(), disputeReason: reason, status: "disputed", paymentStatus: "blocked" },
  });
  await prisma.foodDispute.create({ data: { orderId, openedById: participantId, reason } });
  await createAuditEvent({
    actorUserId: participantId,
    action: "foods.order.disputed",
    entityType: "FoodOrder",
    entityId: order.id,
    participantId,
    organisationId: order.organisationId,
  });
  return order;
}

export async function listParticipantFoodOrders(participantId: string) {
  return prisma.foodOrder.findMany({
    where: { participantId },
    include: { items: true, vendor: true, assignment: true },
    orderBy: { createdAt: "desc" },
  });
}


export async function getFoodOrder(orderId: string) {
  return prisma.foodOrder.findUnique({ where: { id: orderId }, include: { items: true, vendor: true, assignment: { include: { trackingEvents: true, handoverRecord: true } } } });
}

