import type { BookingStatus as PrismaBookingStatus } from "@prisma/client";

/** Canonical Core spine booking statuses (prompt pack). */
export type CoreBookingStatus =
  | "draft"
  | "requested"
  | "provider_review"
  | "accepted"
  | "declined"
  | "cancelled"
  | "in_progress"
  | "completed"
  | "disputed"
  | "invoiced"
  | "paid";

/** Legacy Prisma enum values kept during transition. */
export type LegacyBookingStatus = PrismaBookingStatus;

export const CORE_BOOKING_STATUSES: CoreBookingStatus[] = [
  "draft",
  "requested",
  "provider_review",
  "accepted",
  "declined",
  "cancelled",
  "in_progress",
  "completed",
  "disputed",
  "invoiced",
  "paid",
];

const PRISMA_TO_CORE: Record<string, CoreBookingStatus> = {
  draft: "draft",
  requested: "requested",
  awaiting_provider_acceptance: "provider_review",
  confirmed: "accepted",
  in_progress: "in_progress",
  completed: "completed",
  cancelled: "cancelled",
  disputed: "disputed",
  declined: "declined",
  invoiced: "invoiced",
  paid: "paid",
};

const CORE_TO_PRISMA: Record<CoreBookingStatus, PrismaBookingStatus> = {
  draft: "draft",
  requested: "requested",
  provider_review: "awaiting_provider_acceptance",
  accepted: "confirmed",
  declined: "declined",
  cancelled: "cancelled",
  in_progress: "in_progress",
  completed: "completed",
  disputed: "disputed",
  invoiced: "invoiced",
  paid: "paid",
};

const ALLOWED_TRANSITIONS: Record<CoreBookingStatus, CoreBookingStatus[]> = {
  draft: ["requested", "cancelled"],
  requested: ["provider_review", "accepted", "declined", "cancelled"],
  provider_review: ["accepted", "declined", "cancelled"],
  accepted: ["in_progress", "cancelled"],
  declined: [],
  cancelled: [],
  in_progress: ["completed", "disputed", "cancelled"],
  completed: ["invoiced", "disputed"],
  disputed: ["in_progress", "completed", "cancelled"],
  invoiced: ["paid", "disputed"],
  paid: [],
};

export function toCoreBookingStatus(
  status: string | PrismaBookingStatus
): CoreBookingStatus {
  return PRISMA_TO_CORE[status] ?? (status as CoreBookingStatus);
}

export function toPrismaBookingStatus(
  status: CoreBookingStatus
): PrismaBookingStatus {
  return CORE_TO_PRISMA[status];
}

export function canTransitionBookingStatus(
  current: CoreBookingStatus | string,
  next: CoreBookingStatus | string
): boolean {
  const from = toCoreBookingStatus(current);
  const to = toCoreBookingStatus(next);
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertBookingTransition(
  current: CoreBookingStatus | string,
  next: CoreBookingStatus | string
): void {
  if (!canTransitionBookingStatus(current, next)) {
    throw new Error(
      `INVALID_BOOKING_TRANSITION:${toCoreBookingStatus(current)}->${toCoreBookingStatus(next)}`
    );
  }
}

export function bookingStatusLabel(status: CoreBookingStatus | string): string {
  const labels: Record<CoreBookingStatus, string> = {
    draft: "Draft",
    requested: "Requested",
    provider_review: "Awaiting provider review",
    accepted: "Accepted",
    declined: "Declined",
    cancelled: "Cancelled",
    in_progress: "In progress",
    completed: "Completed",
    disputed: "Disputed",
    invoiced: "Invoiced",
    paid: "Paid",
  };
  return labels[toCoreBookingStatus(status)] ?? String(status);
}
