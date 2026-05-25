import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { createStripePaymentCheckoutSession } from "@/lib/stripe/checkout";
import { isStripeSdkAvailable, stripeConfig } from "@/lib/stripe/config";

const BLOCKED_ORDER_STATUSES = ["cancelled", "disputed", "refunded"];
const BLOCKED_PAYMENT_STATUSES = ["paid", "processing", "checkout_created", "blocked"];

export function foodOrderBlocksPayment(order: {
  status: string;
  paymentStatus: string;
}) {
  return (
    BLOCKED_ORDER_STATUSES.includes(order.status) ||
    BLOCKED_PAYMENT_STATUSES.includes(order.paymentStatus)
  );
}

export function assertFoodPaymentAllowed(order: {
  status: string;
  paymentStatus: string;
}) {
  if (BLOCKED_ORDER_STATUSES.includes(order.status)) {
    throw new Error("PAYMENT_BLOCKED");
  }
  if (BLOCKED_PAYMENT_STATUSES.includes(order.paymentStatus)) {
    throw new Error("PAYMENT_ALREADY_STARTED");
  }
}

export async function createFoodPaymentSession(params: {
  orderId: string;
  actorUserId?: string;
  participantId?: string;
  successUrl?: string;
  cancelUrl?: string;
}) {
  const order = await prisma.foodOrder.findUnique({
    where: { id: params.orderId },
    include: { items: true },
  });
  if (!order) throw new Error("NOT_FOUND");
  const actorUserId = params.actorUserId ?? params.participantId;
  if (params.participantId && order.participantId !== params.participantId) {
    throw new Error("FORBIDDEN");
  }
  assertFoodPaymentAllowed(order);

  const totalCents = order.items.reduce((sum, item) => sum + item.totalCents, 0);
  if (totalCents !== order.totalCents) throw new Error("TOTAL_MISMATCH");

  const metadata = {
    foodOrderId: order.id,
    mapableModule: "foods",
    participantId: order.participantId,
  };
  const successUrl =
    params.successUrl ??
    `${stripeConfig.appUrl}/foods/orders/${order.id}?checkout=success`;
  const cancelUrl =
    params.cancelUrl ??
    `${stripeConfig.appUrl}/foods/orders/${order.id}?checkout=cancelled`;

  const session = isStripeSdkAvailable()
    ? await createStripePaymentCheckoutSession({
        amountCents: order.totalCents,
        currency: order.currency,
        productName: "MapAble Foods order",
        successUrl,
        cancelUrl,
        metadata,
      })
    : {
        id: `food_placeholder_${order.id}`,
        url: null,
        metadata,
      };

  const payment = await prisma.foodPayment.create({
    data: {
      orderId: order.id,
      participantId: order.participantId,
      amountCents: order.totalCents,
      currency: order.currency,
      stripeCheckoutSessionId: session.id,
      status: "checkout_created",
      metadata,
    },
  });

  await prisma.foodOrder.update({
    where: { id: order.id },
    data: { paymentStatus: "checkout_created" },
  });

  await createAuditEvent({
    actorUserId,
    action: "foods.payment.session_created",
    entityType: "FoodPayment",
    entityId: payment.id,
    participantId: order.participantId,
    organisationId: order.organisationId,
    metadata: { stripeCheckoutSessionId: session.id },
  });

  return { payment, session, sessionId: session.id, url: session.url };
}
