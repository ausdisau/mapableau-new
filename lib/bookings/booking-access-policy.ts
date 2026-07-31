import type {
  Booking,
  BookingAssigneeRole,
  BookingStatus,
  BookingType,
  Prisma,
} from "@prisma/client";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { checkConsent } from "@/lib/consent/consent-service";
import { consentScopeToPrisma } from "@/lib/consent/scope-map";
import { prisma } from "@/lib/prisma";
import type { BookingAction, BookingPermissions } from "@/types/bookings";

export class BookingAccessError extends Error {
  constructor(
    message: string,
    public code:
      | "BOOKING_NOT_FOUND"
      | "BOOKING_ACCESS_DENIED"
      | "BOOKING_CONSENT_REQUIRED" = "BOOKING_ACCESS_DENIED"
  ) {
    super(message);
    this.name = "BookingAccessError";
  }
}

type BookingRecord = Pick<
  Booking,
  | "id"
  | "participantId"
  | "status"
  | "bookingType"
  | "assignedOrganisationId"
  | "assignedWorkerId"
  | "assignedDriverId"
  | "assignedPractitionerId"
  | "accessibilitySummary"
  | "shareAccessibility"
>;

const TERMINAL_STATUSES: BookingStatus[] = [
  "closed",
  "cancelled",
  "declined",
];

const TRANSPORT_MODULES: BookingType[] = ["transport", "care_transport"];
const TELEHEALTH_MODULES: BookingType[] = ["telehealth", "care"];

function isTransportBooking(booking: Pick<Booking, "bookingType">) {
  return TRANSPORT_MODULES.includes(booking.bookingType);
}

function isTelehealthBooking(booking: Pick<Booking, "bookingType">) {
  return TELEHEALTH_MODULES.includes(booking.bookingType);
}

export async function familyMemberHasBookingConsent(
  viewerId: string,
  participantId: string
): Promise<boolean> {
  const result = await checkConsent({
    subjectUserId: participantId,
    scope: "booking.read",
    grantedToUserId: viewerId,
  });
  return result;
}

export async function planManagerHasInvoiceConsent(
  viewerId: string,
  participantId: string,
  bookingId: string
): Promise<boolean> {
  const consent = await checkConsent({
    subjectUserId: participantId,
    scope: "plan_manager.invoice_access",
    grantedToUserId: viewerId,
  });
  if (!consent) return false;

  const linkedInvoice = await prisma.invoice.findFirst({
    where: { bookingId, participantId },
    select: { id: true },
  });
  if (linkedInvoice) return true;

  const serviceLog = await prisma.bookingServiceLog.findFirst({
    where: {
      bookingId,
      status: { in: ["submitted", "approved"] },
    },
    select: { id: true },
  });
  return Boolean(serviceLog);
}

async function userAssignedToBooking(
  userId: string,
  booking: BookingRecord
): Promise<boolean> {
  if (booking.assignedWorkerId === userId) return true;
  if (booking.assignedDriverId === userId) return true;
  if (booking.assignedPractitionerId === userId) return true;

  const activeAssignment = await prisma.bookingAssignment.findFirst({
    where: {
      bookingId: booking.id,
      assigneeUserId: userId,
      active: true,
    },
    select: { id: true },
  });
  return Boolean(activeAssignment);
}

export async function assertCanViewBooking(
  user: CurrentUser,
  booking: BookingRecord
): Promise<void> {
  if (isAdminRole(user.primaryRole)) return;

  if (booking.participantId === user.id) return;

  if (user.primaryRole === "family_member") {
    const allowed = await familyMemberHasBookingConsent(
      user.id,
      booking.participantId
    );
    if (allowed) return;
    throw new BookingAccessError(
      "Family access requires participant consent.",
      "BOOKING_CONSENT_REQUIRED"
    );
  }

  if (user.primaryRole === "provider_admin" || user.primaryRole === "transport_operator") {
    if (!booking.assignedOrganisationId) {
      throw new BookingAccessError("Booking access denied.");
    }
    const orgIds = await getUserOrganisationIds(user.id);
    if (orgIds.includes(booking.assignedOrganisationId)) return;
    throw new BookingAccessError("Booking access denied.");
  }

  if (user.primaryRole === "support_worker") {
    if (booking.assignedWorkerId === user.id) return;
    if (await userAssignedToBooking(user.id, booking)) return;
    throw new BookingAccessError("Workers can only view assigned bookings.");
  }

  if (user.primaryRole === "driver") {
    if (!isTransportBooking(booking)) {
      throw new BookingAccessError("Drivers can only view transport bookings.");
    }
    if (booking.assignedDriverId === user.id) return;
    if (await userAssignedToBooking(user.id, booking)) return;
    throw new BookingAccessError("Drivers can only view assigned transport bookings.");
  }

  if (user.primaryRole === "support_coordinator") {
    const consent = await checkConsent({
      subjectUserId: booking.participantId,
      scope: "support_coordination.access",
      grantedToUserId: user.id,
    });
    if (consent) return;
    throw new BookingAccessError(
      "Support coordinator access requires consent.",
      "BOOKING_CONSENT_REQUIRED"
    );
  }

  if (user.primaryRole === "plan_manager") {
    const allowed = await planManagerHasInvoiceConsent(
      user.id,
      booking.participantId,
      booking.id
    );
    if (allowed) return;
    throw new BookingAccessError(
      "Plan managers can only view bookings linked to invoice or approved evidence with consent.",
      "BOOKING_ACCESS_DENIED"
    );
  }

  throw new BookingAccessError("Booking access denied.");
}

export async function buildBookingListWhere(
  user: CurrentUser
): Promise<Prisma.BookingWhereInput> {
  if (isAdminRole(user.primaryRole)) {
    return {};
  }

  if (user.primaryRole === "participant") {
    return { participantId: user.id };
  }

  if (user.primaryRole === "family_member") {
    const consents = await prisma.consentRecord.findMany({
      where: {
        grantedToUserId: user.id,
        scope: consentScopeToPrisma("booking.read"),
        status: "active",
      },
      select: { subjectUserId: true },
    });
    const participantIds = consents.map((c) => c.subjectUserId);
    return participantIds.length
      ? { participantId: { in: participantIds } }
      : { participantId: "__none__" };
  }

  if (
    user.primaryRole === "provider_admin" ||
    user.primaryRole === "transport_operator"
  ) {
    const orgIds = await getUserOrganisationIds(user.id);
    return orgIds.length
      ? { assignedOrganisationId: { in: orgIds } }
      : { assignedOrganisationId: "__none__" };
  }

  if (user.primaryRole === "driver") {
    return {
      bookingType: { in: TRANSPORT_MODULES },
      OR: [
        { assignedDriverId: user.id },
        {
          assignments: {
            some: {
              assigneeUserId: user.id,
              assigneeRole: "driver" as BookingAssigneeRole,
              active: true,
            },
          },
        },
      ],
    };
  }

  if (user.primaryRole === "support_worker") {
    return {
      OR: [
        { assignedWorkerId: user.id },
        {
          assignments: {
            some: {
              assigneeUserId: user.id,
              assigneeRole: "worker" as BookingAssigneeRole,
              active: true,
            },
          },
        },
      ],
    };
  }

  if (user.primaryRole === "support_coordinator") {
    const consents = await prisma.consentRecord.findMany({
      where: {
        grantedToUserId: user.id,
        scope: consentScopeToPrisma("support_coordination.access"),
        status: "active",
      },
      select: { subjectUserId: true },
    });
    const participantIds = consents.map((c) => c.subjectUserId);
    return participantIds.length
      ? { participantId: { in: participantIds } }
      : { participantId: "__none__" };
  }

  return { participantId: "__none__" };
}

export function resolveBookingPermissions(
  user: CurrentUser,
  booking: BookingRecord,
  options?: { canView?: boolean }
): BookingPermissions {
  const canView = options?.canView ?? false;
  const allowedActions: BookingAction[] = [];

  if (!canView) {
    return { canView: false, canUpdate: false, allowedActions: [] };
  }

  allowedActions.push("view", "view_events");

  if (TERMINAL_STATUSES.includes(booking.status)) {
    return { canView: true, canUpdate: false, allowedActions };
  }

  const isParticipant = booking.participantId === user.id;
  const isProvider =
    user.primaryRole === "provider_admin" ||
    user.primaryRole === "transport_operator" ||
    isAdminRole(user.primaryRole);

  if (isParticipant) {
    if (["draft", "requested", "more_information_requested"].includes(booking.status)) {
      allowedActions.push("update", "cancel");
    }
    if (["accepted", "assigned"].includes(booking.status)) {
      allowedActions.push("confirm", "cancel");
    }
    if (["completed", "participant_review", "service_log_submitted"].includes(booking.status)) {
      allowedActions.push("dispute");
    }
  }

  if (isProvider) {
    if (["requested", "provider_review", "awaiting_provider_acceptance"].includes(booking.status)) {
      allowedActions.push("accept", "decline", "request_more_info");
    }
    if (["accepted", "assigned", "provider_review"].includes(booking.status)) {
      allowedActions.push("assign");
    }
    if (["assigned", "participant_confirmed", "confirmed"].includes(booking.status)) {
      allowedActions.push("start");
    }
    if (booking.status === "in_progress") {
      allowedActions.push("complete");
    }
    if (["completed", "service_log_pending", "accepted"].includes(booking.status)) {
      allowedActions.push("create_service_log");
    }
    if (["service_log_submitted", "participant_review"].includes(booking.status)) {
      allowedActions.push("create_invoice");
    }
  }

  if (isAdminRole(user.primaryRole)) {
    allowedActions.push("update", "cancel", "create_service_log", "create_invoice");
  }

  const practitionerAssignable =
    isTelehealthBooking(booking) &&
    (user.primaryRole === "support_worker" || user.primaryRole === "provider_admin");

  if (practitionerAssignable && booking.status === "in_progress") {
    allowedActions.push("complete");
  }

  return {
    canView: true,
    canUpdate: allowedActions.includes("update"),
    allowedActions: [...new Set(allowedActions)],
  };
}

export async function loadBookingForAccess(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      segments: { orderBy: { sortOrder: "asc" } },
      assignedOrganisation: { select: { id: true, name: true, verificationStatus: true } },
      assignments: {
        where: { active: true },
        include: {
          assignee: { select: { id: true, name: true } },
        },
      },
      serviceLogs: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!booking) {
    throw new BookingAccessError("Booking not found.", "BOOKING_NOT_FOUND");
  }

  return booking;
}
