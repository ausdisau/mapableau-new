import type { BookingStatus } from "@prisma/client";

const STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  draft: ["requested", "cancelled"],
  requested: ["provider_review", "accepted", "awaiting_provider_acceptance", "cancelled"],
  provider_review: [
    "accepted",
    "declined",
    "more_information_requested",
    "cancelled",
  ],
  awaiting_provider_acceptance: [
    "accepted",
    "confirmed",
    "declined",
    "more_information_requested",
    "cancelled",
  ],
  more_information_requested: ["provider_review", "requested", "cancelled"],
  accepted: ["assigned", "participant_confirmed", "confirmed", "cancelled"],
  confirmed: ["assigned", "participant_confirmed", "in_progress", "cancelled"],
  assigned: ["participant_confirmed", "in_progress", "cancelled"],
  participant_confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled", "disputed"],
  completed: [
    "service_log_pending",
    "participant_review",
    "disputed",
    "closed",
  ],
  service_log_pending: ["service_log_submitted", "disputed"],
  service_log_submitted: ["participant_review", "closed", "disputed"],
  participant_review: ["closed", "disputed"],
  closed: [],
  cancelled: [],
  declined: [],
  disputed: ["participant_review", "closed", "cancelled"],
};

export function normalizeLegacyStatus(status: BookingStatus): BookingStatus {
  if (status === "awaiting_provider_acceptance") return "provider_review";
  if (status === "confirmed") return "accepted";
  return status;
}

export function canTransitionStatus(
  from: BookingStatus,
  to: BookingStatus
): boolean {
  const normalizedFrom = normalizeLegacyStatus(from);
  const normalizedTo = normalizeLegacyStatus(to);
  if (normalizedFrom === normalizedTo) return true;

  const allowed = STATUS_TRANSITIONS[normalizedFrom] ?? [];
  return allowed.includes(normalizedTo) || allowed.includes(to);
}

export function assertValidStatusTransition(
  from: BookingStatus,
  to: BookingStatus
): void {
  if (!canTransitionStatus(from, to)) {
    throw new Error("BOOKING_INVALID_STATUS_TRANSITION");
  }
}

export function statusForProviderAccept(current: BookingStatus): BookingStatus {
  assertValidStatusTransition(current, "accepted");
  return "accepted";
}

export function statusForProviderDecline(current: BookingStatus): BookingStatus {
  assertValidStatusTransition(current, "declined");
  return "declined";
}

export function statusForMoreInfoRequest(
  current: BookingStatus
): BookingStatus {
  assertValidStatusTransition(current, "more_information_requested");
  return "more_information_requested";
}

export function statusForAssignment(current: BookingStatus): BookingStatus {
  if (canTransitionStatus(current, "assigned")) return "assigned";
  return current;
}

export function statusForParticipantConfirm(
  current: BookingStatus
): BookingStatus {
  assertValidStatusTransition(current, "participant_confirmed");
  return "participant_confirmed";
}

export function statusForStart(current: BookingStatus): BookingStatus {
  assertValidStatusTransition(current, "in_progress");
  return "in_progress";
}

export function statusForComplete(current: BookingStatus): BookingStatus {
  if (canTransitionStatus(current, "completed")) return "completed";
  throw new Error("BOOKING_INVALID_STATUS_TRANSITION");
}

export function statusAfterComplete(): BookingStatus {
  return "service_log_pending";
}

export function statusForCancel(current: BookingStatus): BookingStatus {
  assertValidStatusTransition(current, "cancelled");
  return "cancelled";
}

export function statusForDispute(current: BookingStatus): BookingStatus {
  assertValidStatusTransition(current, "disputed");
  return "disputed";
}

export function statusForServiceLogSubmit(
  current: BookingStatus
): BookingStatus {
  if (canTransitionStatus(current, "service_log_submitted")) {
    return "service_log_submitted";
  }
  if (canTransitionStatus(current, "service_log_pending")) {
    return "service_log_pending";
  }
  return current;
}

export function providerReviewStatus(current: BookingStatus): BookingStatus {
  if (current === "requested") return "provider_review";
  return current;
}
