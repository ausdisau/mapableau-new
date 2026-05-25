import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { stripeConfig } from "@/lib/stripe/config";
import { createStripePaymentCheckoutSession } from "@/lib/stripe/checkout";
import { prisma } from "@/lib/prisma";

import { canCreatePaymentForOrder } from "./order-service";
import { computeOrderTotals } from "./order-totals";

export async function createFoodPaymentSession(params: {
  orderId: string;
  actorUserId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const order = await prisma.foodOrder.findUnique({
    where: { id: params.orderId },
    include: { items: true },
  });
  if (!order) throw new Error("NOT_FOUND");

  if (!canCreatePaymentForOrder(order)) {
    throw new Error("PAYMENT_NOT_ALLOWED");
  }

  const recomputed = computeOrderTotals({
    lines: order.items.map((i) => ({
      titleSnapshot: i.titleSnapshot,
      quantity: i.quantity,
      unitAmount: i.unitAmount,
      itemCostType: i.itemCostType,
    })),
    deliveryFeeAmount: order.deliveryFeeAmount,
    preparationFeeAmount: order.preparationFeeAmount,
    supportFeeAmount: order.supportFeeAmount,
  });

  if (recomputed.totalAmount !== order.totalAmount) {
    throw new Error("ORDER_TOTAL_MISMATCH");
  }

  const payment = await prisma.foodPayment.create({
    data: {
      orderId: order.id,
      amountCents: order.totalAmount,
      currency: order.currency,
      status: "pending",
    },
  });

  let checkoutUrl: string | null = null;
  let stripeSessionId: string | null = null;

  try {
    const session = await createStripePaymentCheckoutSession({
      amountCents: order.totalAmount,
      currency: order.currency,
      productName: `MapAble Foods order ${order.id.slice(0, 8)}`,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      metadata: {
        foodOrderId: order.id,
        foodPaymentId: payment.id,
        mapableModule: "foods",
        mapableUserId: order.participantId,
      },
    });
    checkoutUrl = session.url;
    stripeSessionId = session.id;
  } catch {
    checkoutUrl = `/foods/orders/${order.id}?payment=placeholder`;
  }

  await prisma.foodPayment.update({
    where: { id: payment.id },
    data: { stripeSessionId: stripeSessionId ?? undefined },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "foods.payment.session_created",
    entityType: "FoodPayment",
    entityId: payment.id,
    participantId: order.participantId,
    metadata: { amountCents: order.totalAmount },
  });

  return {
    paymentId: payment.id,
    checkoutUrl,
    amountCents: order.totalAmount,
    currency: order.currency ?? stripeConfig.defaultCurrency,
  };
}
