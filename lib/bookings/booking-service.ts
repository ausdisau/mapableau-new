import type { BookingStatus, BookingType, Prisma } from "@prisma/client";
import type { z } from "zod";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { canShareAccessibilityWithOrganisation } from "@/lib/consent/consent-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";
import {
  assertCanViewBooking,
  BookingAccessError,
  buildBookingListWhere,
  loadBookingForAccess,
  resolveBookingPermissions,
} from "@/lib/bookings/booking-access-policy";
import { assignBookingWorker } from "@/lib/bookings/booking-assignment-service";
import {
  logBookingAudit,
  logSensitiveBookingRead,
} from "@/lib/bookings/booking-audit-service";
import {
  recordBookingEvent,
  recordStatusChangeEvent,
} from "@/lib/bookings/booking-event-service";
import {
  assertValidStatusTransition,
  providerReviewStatus,
  statusAfterComplete,
  statusForCancel,
  statusForComplete,
  statusForDispute,
  statusForMoreInfoRequest,
  statusForParticipantConfirm,
  statusForProviderAccept,
  statusForProviderDecline,
  statusForServiceLogSubmit,
  statusForStart,
} from "@/lib/bookings/booking-status-service";
import { createInvoiceDraftFromBooking } from "@/lib/invoices/invoice-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import type { createBookingSchema } from "@/lib/validation/booking-schemas";

type CreateBookingInput = z.infer<typeof createBookingSchema> & {
  participantId: string;
  createdById: string;
};

async function assertProviderEligible(organisationId: string): Promise<void> {
  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
    select: { verificationStatus: true, status: true },
  });
  if (!org || org.status !== "active" || org.verificationStatus !== "verified") {
    throw new Error("BOOKING_PROVIDER_NOT_ELIGIBLE");
  }
}

async function ensureBookingConversation(
  bookingId: string,
  participantId: string,
  organisationId: string | null,
  createdById: string
) {
  const existing = await prisma.conversation.findFirst({
    where: { bookingId, type: "booking_thread" },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      type: "booking_thread",
      title: "Booking conversation",
      bookingId,
      participantId,
      organisationId: organisationId ?? undefined,
      createdById,
      participants: {
        create: [{ userId: participantId }],
      },
    },
  });
}

async function transitionBookingStatus(params: {
  bookingId: string;
  fromStatus: BookingStatus;
  toStatus: BookingStatus;
  actorUserId: string;
  data?: Record<string, unknown>;
  note?: string;
  auditAction: string;
}) {
  assertValidStatusTransition(params.fromStatus, params.toStatus);

  const booking = await prisma.booking.update({
    where: { id: params.bookingId },
    data: {
      status: params.toStatus,
      ...(params.data ?? {}),
    },
    include: {
      segments: { orderBy: { sortOrder: "asc" } },
      assignedOrganisation: { select: { id: true, name: true } },
    },
  });

  await recordStatusChangeEvent({
    bookingId: params.bookingId,
    fromStatus: params.fromStatus,
    toStatus: params.toStatus,
    actorUserId: params.actorUserId,
    note: params.note,
  });

  await logBookingAudit({
    action: params.auditAction,
    actorUserId: params.actorUserId,
    bookingId: params.bookingId,
    participantId: booking.participantId,
    organisationId: booking.assignedOrganisationId ?? undefined,
    metadata: { fromStatus: params.fromStatus, toStatus: params.toStatus },
  });

  return booking;
}

export async function createBooking(input: CreateBookingInput) {
  if (input.shareAccessibility && input.assignedOrganisationId) {
    const allowed = await canShareAccessibilityWithOrganisation(
      input.participantId,
      input.assignedOrganisationId,
      input.bookingType as "care" | "transport" | "care_transport"
    );
    if (!allowed) {
      throw new Error("BOOKING_CONSENT_REQUIRED");
    }
  }

  const status = (input.status ?? "requested") as BookingStatus;
  const module = (input.module ?? input.bookingType) as BookingType;

  const booking = await prisma.booking.create({
    data: {
      participantId: input.participantId,
      bookingType: input.bookingType,
      module,
      status,
      requestedStart: new Date(input.requestedStart),
      requestedEnd: input.requestedEnd ? new Date(input.requestedEnd) : null,
      pickupAddress: input.pickupAddress,
      dropoffAddress: input.dropoffAddress,
      careLocation: input.careLocation,
      accessibilitySummary: input.accessibilitySummary,
      participantNotes: input.participantNotes,
      assignedOrganisationId: input.assignedOrganisationId,
      shareAccessibility: input.shareAccessibility,
      fundingSourceTag: input.fundingSourceTag,
      createdById: input.createdById,
      segments: input.segments?.length
        ? {
            create: input.segments.map((s) => ({
              segmentType: s.segmentType,
              startTime: s.startTime ? new Date(s.startTime) : null,
              endTime: s.endTime ? new Date(s.endTime) : null,
              pickupAddress: s.pickupAddress,
              dropoffAddress: s.dropoffAddress,
              bufferBeforeMinutes: s.bufferBeforeMinutes,
              bufferAfterMinutes: s.bufferAfterMinutes,
              sortOrder: s.sortOrder,
            })),
          }
        : undefined,
    },
    include: { segments: { orderBy: { sortOrder: "asc" } } },
  });

  await recordBookingEvent({
    bookingId: booking.id,
    eventType: "booking_created",
    title: "Booking created",
    toStatus: status,
    actorUserId: input.createdById,
  });

  await logBookingAudit({
    action: "booking.created",
    actorUserId: input.createdById,
    bookingId: booking.id,
    participantId: input.participantId,
    metadata: { bookingType: input.bookingType, status },
  });

  await ensureBookingConversation(
    booking.id,
    input.participantId,
    input.assignedOrganisationId ?? null,
    input.createdById
  );

  await notifyUser(
    input.participantId,
    "booking",
    "Booking request received",
    `Your ${input.bookingType.replace(/_/g, " ")} booking request has been submitted. We will confirm details with you soon.`
  );

  return booking;
}

export async function listBookingsForUser(
  user: CurrentUser,
  filters?: { status?: BookingStatus; module?: BookingType }
) {
  const where = await buildBookingListWhere(user);
  const moduleFilter: Prisma.BookingWhereInput | undefined = filters?.module
    ? {
        OR: [{ module: filters.module }, { bookingType: filters.module }],
      }
    : undefined;

  const bookings = await prisma.booking.findMany({
    where: {
      ...where,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(moduleFilter ?? {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      assignedOrganisation: { select: { id: true, name: true } },
    },
    take: 100,
  });

  return bookings.map((booking) => ({
    ...booking,
    permissions: resolveBookingPermissions(user, booking, { canView: true }),
  }));
}

export async function getBookingForUser(user: CurrentUser, bookingId: string) {
  const booking = await loadBookingForAccess(bookingId);

  try {
    await assertCanViewBooking(user, booking);
  } catch (error) {
    if (error instanceof BookingAccessError) {
      if (error.code === "BOOKING_NOT_FOUND") throw error;
      throw error;
    }
    throw error;
  }

  const includesAccessibility = Boolean(
    booking.shareAccessibility && booking.accessibilitySummary
  );

  await logSensitiveBookingRead({
    actorUserId: user.id,
    bookingId: booking.id,
    participantId: booking.participantId,
    includesAccessibility,
  });

  return {
    ...booking,
    permissions: resolveBookingPermissions(user, booking, { canView: true }),
  };
}

export async function updateBookingDetails(
  bookingId: string,
  data: {
    requestedStart?: string;
    requestedEnd?: string | null;
    pickupAddress?: string | null;
    dropoffAddress?: string | null;
    careLocation?: string | null;
    participantNotes?: string | null;
    providerNotes?: string | null;
    shareAccessibility?: boolean;
  },
  actorUserId: string
) {
  const existing = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!existing) throw new Error("BOOKING_NOT_FOUND");

  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      requestedStart: data.requestedStart
        ? new Date(data.requestedStart)
        : undefined,
      requestedEnd:
        data.requestedEnd === null
          ? null
          : data.requestedEnd
            ? new Date(data.requestedEnd)
            : undefined,
      pickupAddress: data.pickupAddress,
      dropoffAddress: data.dropoffAddress,
      careLocation: data.careLocation,
      participantNotes: data.participantNotes,
      providerNotes: data.providerNotes,
      shareAccessibility: data.shareAccessibility,
    },
    include: { segments: { orderBy: { sortOrder: "asc" } } },
  });

  await logBookingAudit({
    action: "booking.updated",
    actorUserId,
    bookingId: booking.id,
    participantId: booking.participantId,
  });

  return booking;
}

export async function cancelBooking(
  bookingId: string,
  actorUserId: string,
  reason?: string
) {
  const existing = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!existing) throw new Error("BOOKING_NOT_FOUND");

  const toStatus = statusForCancel(existing.status);
  return transitionBookingStatus({
    bookingId,
    fromStatus: existing.status,
    toStatus,
    actorUserId,
    note: reason,
    auditAction: "booking.cancelled",
  });
}

export async function confirmBookingByParticipant(
  bookingId: string,
  actorUserId: string,
  note?: string
) {
  const existing = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!existing) throw new Error("BOOKING_NOT_FOUND");
  if (existing.participantId !== actorUserId) {
    throw new Error("BOOKING_ACCESS_DENIED");
  }

  const toStatus = statusForParticipantConfirm(existing.status);
  return transitionBookingStatus({
    bookingId,
    fromStatus: existing.status,
    toStatus,
    actorUserId,
    note,
    auditAction: "booking.participant_confirmed",
  });
}

export async function disputeBooking(
  bookingId: string,
  actorUserId: string,
  reason: string
) {
  const existing = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!existing) throw new Error("BOOKING_NOT_FOUND");

  const toStatus = statusForDispute(existing.status);
  return transitionBookingStatus({
    bookingId,
    fromStatus: existing.status,
    toStatus,
    actorUserId,
    note: reason,
    auditAction: "booking.disputed",
  });
}

export async function providerAcceptBookingRequest(
  bookingId: string,
  organisationId: string,
  actorUserId: string,
  note?: string
) {
  const existing = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!existing) throw new Error("BOOKING_NOT_FOUND");

  await assertProviderEligible(organisationId);

  const reviewStatus = providerReviewStatus(existing.status);
  const toStatus = statusForProviderAccept(reviewStatus);

  const booking = await transitionBookingStatus({
    bookingId,
    fromStatus: existing.status,
    toStatus,
    actorUserId,
    note,
    auditAction: "booking.provider_accepted",
    data: {
      providerResponseStatus: "accepted",
      providerResponseNote: note,
      providerRespondedAt: new Date(),
      assignedOrganisationId: organisationId,
    },
  });

  await notifyUser(
    booking.participantId,
    "booking",
    "Booking accepted",
    "Your provider has accepted the booking request."
  );

  return booking;
}

export async function providerDeclineBookingRequest(
  bookingId: string,
  organisationId: string,
  actorUserId: string,
  note?: string
) {
  const existing = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!existing) throw new Error("BOOKING_NOT_FOUND");

  const toStatus = statusForProviderDecline(existing.status);
  const booking = await transitionBookingStatus({
    bookingId,
    fromStatus: existing.status,
    toStatus,
    actorUserId,
    note,
    auditAction: "booking.provider_declined",
    data: {
      providerResponseStatus: "declined",
      providerResponseNote: note,
      providerRespondedAt: new Date(),
    },
  });

  await notifyUser(
    booking.participantId,
    "booking",
    "Booking update",
    "Your booking request was declined by the provider. Our team will follow up."
  );

  return booking;
}

export async function providerRequestMoreInfo(
  bookingId: string,
  actorUserId: string,
  note?: string
) {
  const existing = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!existing) throw new Error("BOOKING_NOT_FOUND");

  const toStatus = statusForMoreInfoRequest(existing.status);
  return transitionBookingStatus({
    bookingId,
    fromStatus: existing.status,
    toStatus,
    actorUserId,
    note,
    auditAction: "booking.more_information_requested",
    data: { providerResponseNote: note },
  });
}

export async function startBooking(
  bookingId: string,
  actorUserId: string
) {
  const existing = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!existing) throw new Error("BOOKING_NOT_FOUND");

  const toStatus = statusForStart(existing.status);
  return transitionBookingStatus({
    bookingId,
    fromStatus: existing.status,
    toStatus,
    actorUserId,
    auditAction: "booking.started",
  });
}

export async function completeBooking(
  bookingId: string,
  actorUserId: string
) {
  const existing = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!existing) throw new Error("BOOKING_NOT_FOUND");

  statusForComplete(existing.status);
  const completed = await transitionBookingStatus({
    bookingId,
    fromStatus: existing.status,
    toStatus: "completed",
    actorUserId,
    auditAction: "booking.completed",
  });

  const pendingStatus = statusAfterComplete();
  return transitionBookingStatus({
    bookingId,
    fromStatus: "completed",
    toStatus: pendingStatus,
    actorUserId,
    auditAction: "booking.service_log_pending",
  });
}

export async function assignBooking(params: {
  bookingId: string;
  assigneeUserId: string;
  assigneeRole: "worker" | "driver" | "practitioner";
  organisationId: string;
  assignedById: string;
  notes?: string;
}) {
  return assignBookingWorker(params);
}

export async function createBookingServiceLog(params: {
  bookingId: string;
  createdById: string;
  summary?: string;
  notes?: string;
  evidenceDocumentIds?: string[];
  submit?: boolean;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
  });
  if (!booking) throw new Error("BOOKING_NOT_FOUND");

  const allowedStatuses: BookingStatus[] = [
    "accepted",
    "completed",
    "service_log_pending",
    "in_progress",
  ];
  if (!allowedStatuses.includes(booking.status)) {
    throw new Error("SERVICE_LOG_NOT_ALLOWED");
  }

  const serviceLog = await prisma.bookingServiceLog.create({
    data: {
      bookingId: params.bookingId,
      summary: params.summary,
      notes: params.notes,
      evidenceDocumentIds: params.evidenceDocumentIds ?? [],
      createdById: params.createdById,
      status: params.submit ? "submitted" : "draft",
      submittedAt: params.submit ? new Date() : null,
    },
  });

  if (params.submit) {
    const nextStatus = statusForServiceLogSubmit(booking.status);
    if (nextStatus !== booking.status) {
      await transitionBookingStatus({
        bookingId: params.bookingId,
        fromStatus: booking.status,
        toStatus: nextStatus,
        actorUserId: params.createdById,
        auditAction: "booking.service_log_submitted",
      });
    }
  }

  await logBookingAudit({
    action: "booking.service_log_created",
    actorUserId: params.createdById,
    bookingId: params.bookingId,
    participantId: booking.participantId,
    metadata: { serviceLogId: serviceLog.id, submitted: params.submit ?? false },
  });

  return serviceLog;
}

export async function createBookingInvoice(
  bookingId: string,
  createdById: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      serviceLogs: {
        where: { status: { in: ["submitted", "approved"] } },
        take: 1,
      },
    },
  });
  if (!booking) throw new Error("BOOKING_NOT_FOUND");

  if (!booking.serviceLogs.length) {
    throw new Error("INVOICE_EVIDENCE_REQUIRED");
  }

  const invoice = await createInvoiceDraftFromBooking(bookingId, createdById);

  await logBookingAudit({
    action: "booking.invoice_created",
    actorUserId: createdById,
    bookingId,
    participantId: booking.participantId,
    organisationId: booking.assignedOrganisationId ?? undefined,
    metadata: { invoiceId: invoice.id },
  });

  return invoice;
}

export async function assertProviderCanManageBooking(
  user: CurrentUser,
  bookingId: string,
  organisationId?: string
) {
  const booking = await loadBookingForAccess(bookingId);
  const orgIds = await getUserOrganisationIds(user.id);
  const targetOrg = organisationId ?? booking.assignedOrganisationId;
  if (!targetOrg || !orgIds.includes(targetOrg)) {
    throw new BookingAccessError("Organisation access denied.");
  }
  return booking;
}

/** @deprecated Use updateBookingDetails */
export async function updateBooking(
  bookingId: string,
  data: Parameters<typeof updateBookingDetails>[1],
  actorUserId: string
) {
  return updateBookingDetails(bookingId, data, actorUserId);
}
