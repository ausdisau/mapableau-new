import type { AccessWorkOrderStatus } from "@prisma/client";

const TRANSITIONS: Record<AccessWorkOrderStatus, AccessWorkOrderStatus[]> = {
  requested: ["acknowledged", "cancelled"],
  acknowledged: ["scheduled", "in_progress", "cancelled"],
  scheduled: ["in_progress", "overdue", "cancelled"],
  in_progress: ["completed_pending_verification", "overdue", "cancelled"],
  completed_pending_verification: ["verified", "in_progress"],
  verified: [],
  cancelled: [],
  overdue: ["in_progress", "completed_pending_verification", "cancelled"],
};

export function canTransitionWorkOrder(
  from: AccessWorkOrderStatus,
  to: AccessWorkOrderStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertWorkOrderTransition(
  from: AccessWorkOrderStatus,
  to: AccessWorkOrderStatus,
): void {
  if (!canTransitionWorkOrder(from, to))
    throw new Error(`INVALID_WORK_ORDER_TRANSITION:${from}:${to}`);
}
