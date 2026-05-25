import type { FoodDeliveryStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

import { notifyFoodsParticipant } from "./foods-notification-service";
import { privacySafeOrderNotification } from "./notification-copy";

const STATUS_LABELS: Record<FoodDeliveryStatus, string> = {
  not_assigned: "Delivery not yet assigned",
  assigned: "Driver assigned",
  picked_up: "Order picked up",
  out_for_delivery: "Out for delivery",
  arriving_soon: "Arriving soon",
  delivered: "Delivered",
  handover_confirmed: "Handover confirmed",
  failed: "Delivery failed",
  disputed: "Delivery disputed",
};

export function plainLanguageDeliveryStatus(status: FoodDeliveryStatus) {
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export async function assignDelivery(
  orderId: string,
  driverUserId: string,
  actorUserId: string
) {
  const assignment = await prisma.foodDeliveryAssignment.upsert({
    where: { orderId },
    create: { orderId, driverUserId, status: "assigned" },
    update: { driverUserId, status: "assigned" },
  });

  await prisma.foodOrder.update({
    where: { id: orderId },
    data: { deliveryStatus: "assigned" },
  });

  await recordTrackingEvent(assignment.id, "assigned", actorUserId);

  const order = await prisma.foodOrder.findUnique({
    where: { id: orderId },
    select: { participantId: true },
  });

  await createAuditEvent({
    actorUserId,
    action: "foods.delivery.assigned",
    entityType: "FoodDeliveryAssignment",
    entityId: assignment.id,
    participantId: order?.participantId,
    metadata: { driverUserId },
  });

  return assignment;
}

export async function updateDeliveryStatus(
  orderId: string,
  status: FoodDeliveryStatus,
  actorUserId: string
) {
  const assignment = await prisma.foodDeliveryAssignment.findUnique({
    where: { orderId },
    include: { order: true },
  });
  if (!assignment) throw new Error("DELIVERY_NOT_FOUND");

  await prisma.foodDeliveryAssignment.update({
    where: { id: assignment.id },
    data: {
      status,
      deliveredAt: status === "delivered" ? new Date() : undefined,
      pickupAt: status === "picked_up" ? new Date() : assignment.pickupAt,
    },
  });

  await prisma.foodOrder.update({
    where: { id: orderId },
    data: { deliveryStatus: status },
  });

  await recordTrackingEvent(assignment.id, status, actorUserId);

  await prisma.foodOrderEvent.create({
    data: {
      orderId,
      eventType: "delivery_status",
      title: plainLanguageDeliveryStatus(status),
      actorUserId,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "foods.delivery.status_updated",
    entityType: "FoodOrder",
    entityId: orderId,
    participantId: assignment.order.participantId,
    metadata: { status },
  });

  if (status === "out_for_delivery" || status === "arriving_soon") {
    await notifyFoodsParticipant(
      assignment.order.participantId,
      "deliveryOnWay",
      orderId
    );
  }
  if (status === "delivered") {
    await notifyFoodsParticipant(
      assignment.order.participantId,
      "delivered",
      orderId
    );
  }

  return {
    assignment,
    plainLanguage: plainLanguageDeliveryStatus(status),
    notificationCopy: privacySafeOrderNotification("deliveryOnWay"),
  };
}

async function recordTrackingEvent(
  assignmentId: string,
  status: FoodDeliveryStatus,
  actorUserId: string
) {
  await prisma.foodDeliveryTrackingEvent.create({
    data: { assignmentId, status, actorUserId },
  });
}

export async function listDriverDeliveries(driverUserId: string) {
  return prisma.foodDeliveryAssignment.findMany({
    where: { driverUserId },
    orderBy: { updatedAt: "desc" },
    include: {
      order: {
        select: {
          id: true,
          deliveryAddressFull: true,
          deliveryAddressSuburb: true,
          deliveryWindowStart: true,
          deliveryWindowEnd: true,
          handoverInstructionsJson: true,
          deliveryStatus: true,
          status: true,
        },
      },
    },
  });
}

export async function getDriverDelivery(deliveryId: string, driverUserId: string) {
  return prisma.foodDeliveryAssignment.findFirst({
    where: { id: deliveryId, driverUserId },
    include: {
      order: true,
      trackingEvents: { orderBy: { createdAt: "asc" } },
      handover: true,
    },
  });
}

export async function getTrackingByPublicToken(token: string) {
  return prisma.foodDeliveryAssignment.findUnique({
    where: { publicTrackingToken: token },
    include: {
      order: {
        select: { deliveryAddressSuburb: true, deliveryStatus: true },
      },
      trackingEvents: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
}
