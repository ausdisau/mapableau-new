import type {
  AccessWorkOrder,
  AccessWorkOrderPriority,
  AccessWorkOrderStatus,
  AccessWorkOrderType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { assertWorkOrderTransition } from "./work-order-state-machine";

export async function createWorkOrder(input: {
  assetId: string;
  workType: AccessWorkOrderType;
  title: string;
  safeDescription: string;
  incidentId?: string | null;
  priority?: AccessWorkOrderPriority;
  maintainerEntityId?: string | null;
}): Promise<AccessWorkOrder> {
  return prisma.accessWorkOrder.create({
    data: {
      assetId: input.assetId,
      incidentId: input.incidentId ?? null,
      workType: input.workType,
      priority: input.priority ?? "medium",
      title: input.title,
      safeDescription: input.safeDescription,
      maintainerEntityId: input.maintainerEntityId ?? null,
    },
  });
}

export async function transitionWorkOrder(
  workOrderId: string,
  to: AccessWorkOrderStatus,
  verifiedById?: string | null,
): Promise<AccessWorkOrder> {
  const workOrder = await prisma.accessWorkOrder.findUniqueOrThrow({
    where: { id: workOrderId },
  });
  assertWorkOrderTransition(workOrder.status, to);
  return prisma.accessWorkOrder.update({
    where: { id: workOrderId },
    data: {
      status: to,
      acknowledgedAt:
        to === "acknowledged" ? new Date() : workOrder.acknowledgedAt,
      scheduledAt: to === "scheduled" ? new Date() : workOrder.scheduledAt,
      startedAt: to === "in_progress" ? new Date() : workOrder.startedAt,
      completedAt:
        to === "completed_pending_verification"
          ? new Date()
          : workOrder.completedAt,
      verifiedAt: to === "verified" ? new Date() : workOrder.verifiedAt,
      verifiedById:
        to === "verified" ? (verifiedById ?? null) : workOrder.verifiedById,
    },
  });
}

export function completionRestoresOperationalStatus(): false {
  return false;
}
