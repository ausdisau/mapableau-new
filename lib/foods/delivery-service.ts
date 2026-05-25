import crypto from "node:crypto";

import type { FoodDeliveryStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

import { notifyFoodOrderUpdated } from "./notification-service";

const NEXT_DELIVERY_STATUSES: Record<FoodDeliveryStatus, FoodDeliveryStatus[]> = {
  not_assigned: ["assigned", "cancelled"],
  assigned: ["picked_up", "cancelled", "disputed"],
  picked_up: ["out_for_delivery", "failed", "disputed"],
  out_for_delivery: ["arrived", "delivered", "failed", "disputed"],
  arrived: ["delivered", "failed", "disputed"],
  delivered: ["disputed"],
  failed: [],
  cancelled: [],
  disputed: [],
};

export function canTransitionFoodDelivery(from: FoodDeliveryStatus, to: FoodDeliveryStatus) {
  return NEXT_DELIVERY_STATUSES[from].includes(to);
}

export function plainLanguageDeliveryStatus(status: FoodDeliveryStatus): string {
  const labels: Record<FoodDeliveryStatus, string> = {
    not_assigned: "Delivery not assigned",
    assigned: "Driver assigned",
    picked_up: "Order picked up",
    out_for_delivery: "Delivery is on the way",
    arrived: "Driver has arrived",
    delivered: "Order delivered",
    failed: "Delivery issue reported",
    cancelled: "Delivery cancelled",
    disputed: "Delivery disputed",
  };
  return labels[status];
}

export async function assignFoodDelivery(params: {
  orderId: string;
  actorUserId: string;
  organisationId?: string;
  driverUserId?: string;
  driverDisplayName?: string;
  handoverInstructions?: Record<string, unknown>;
}) {
  const order = await prisma.foodOrder.findUnique({ where: { id: params.orderId } });
  if (!order) throw new Error("NOT_FOUND");
  if (["cancelled", "disputed"].includes(order.status)) throw new Error("INVALID_STATUS");

  const assignment = await prisma.foodDeliveryAssignment.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      organisationId: params.organisationId ?? order.organisationId,
      driverUserId: params.driverUserId,
      driverDisplayName: params.driverDisplayName,
      assignedById: params.actorUserId,
      publicTrackingToken: crypto.randomBytes(18).toString("hex"),
      addressSnapshotFull: order.deliveryAddressFull,
      addressSnapshotSuburb: order.deliveryAddressSuburb,
      handoverInstructions: params.handoverInstructions as any,
      trackingEvents: { create: { status: "assigned", actorUserId: params.actorUserId, message: "Delivery assigned" } },
    },
    update: {
      driverUserId: params.driverUserId,
      driverDisplayName: params.driverDisplayName,
      assignedById: params.actorUserId,
      status: "assigned",
      handoverInstructions: params.handoverInstructions as any,
    },
  });

  await prisma.foodOrder.update({
    where: { id: order.id },
    data: { status: "assigned", events: { create: { fromStatus: order.status, toStatus: "assigned", actorUserId: params.actorUserId, message: "Delivery assigned" } } },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "foods.delivery.assigned",
    entityType: "FoodDeliveryAssignment",
    entityId: assignment.id,
    participantId: order.participantId,
    organisationId: order.organisationId,
  });

  await notifyFoodOrderUpdated(order.participantId, "assigned");
  return assignment;
}

export async function updateFoodDeliveryStatus(params: {
  assignmentId: string;
  actorUserId: string;
  status: FoodDeliveryStatus;
  message?: string;
  lat?: number;
  lng?: number;
}) {
  const assignment = await prisma.foodDeliveryAssignment.findUnique({ where: { id: params.assignmentId }, include: { order: true } });
  if (!assignment) throw new Error("NOT_FOUND");
  if (!canTransitionFoodDelivery(assignment.status, params.status)) throw new Error("INVALID_STATUS");

  const updated = await prisma.foodDeliveryAssignment.update({ where: { id: assignment.id }, data: { status: params.status } });
  await prisma.foodDeliveryTrackingEvent.create({
    data: { assignmentId: assignment.id, status: params.status, message: params.message ?? plainLanguageDeliveryStatus(params.status), lat: params.lat, lng: params.lng, actorUserId: params.actorUserId },
  });

  if (params.status === "out_for_delivery" || params.status === "delivered") {
    await prisma.foodOrder.update({ where: { id: assignment.orderId }, data: { status: params.status === "delivered" ? "delivered" : "out_for_delivery" } });
  }

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "foods.delivery.status_updated",
    entityType: "FoodDeliveryAssignment",
    entityId: assignment.id,
    participantId: assignment.order.participantId,
    organisationId: assignment.organisationId,
    metadata: { status: params.status },
  });

  await notifyFoodOrderUpdated(assignment.order.participantId, params.status);
  return updated;
}

export async function listAssignedFoodDeliveries(driverUserId: string) {
  return prisma.foodDeliveryAssignment.findMany({
    where: { driverUserId },
    include: { order: { include: { items: true } }, trackingEvents: true, handoverRecord: true },
    orderBy: { assignedAt: "desc" },
  });
}

export async function getPublicFoodTracking(token: string) {
  return prisma.foodDeliveryAssignment.findUnique({
    where: { publicTrackingToken: token },
    include: { order: { select: { deliveryAddressSuburb: true } }, trackingEvents: { orderBy: { createdAt: "desc" }, take: 10 } },
  });
}