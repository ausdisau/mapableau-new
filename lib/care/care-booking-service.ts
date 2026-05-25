import type { CareBookingStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import {
  assertProviderCanAccessBooking,
  assertProviderCanAccessCareRequest,
} from "@/lib/care/access-control";
import { prisma } from "@/lib/prisma";

export async function recordCareBookingEvent(params: {
  bookingId: string;
  eventType: string;
  actorUserId?: string;
  notes?: string;
  metadata?: unknown;
}) {
  return prisma.careBookingEvent.create({
    data: {
      bookingId: params.bookingId,
      eventType: params.eventType,
      actorUserId: params.actorUserId,
      notes: params.notes,
      metadata: params.metadata as object | undefined,
    },
  });
}

export async function createCareBookingForRequest(params: {
  careRequestId: string;
  actorUserId: string;
}) {
  const request = await prisma.careRequest.findUnique({
    where: { id: params.careRequestId },
  });
  if (!request) throw new Error("REQUEST_NOT_FOUND");
  if (!request.assignedOrganisationId) throw new Error("ORGANISATION_REQUIRED");

  const genericBooking = await prisma.booking.create({
    data: {
      participantId: request.participantId,
      bookingType: "care",
      status: "confirmed",
      requestedStart: request.preferredDate ?? new Date(),
      requestedEnd: request.preferredDate ?? undefined,
      careLocation: request.address,
      accessibilitySummary: request.shareAccessibility
        ? request.accessRequirementsSummary
        : undefined,
      shareAccessibility: request.shareAccessibility,
      assignedOrganisationId: request.assignedOrganisationId,
      createdById: params.actorUserId,
      providerResponseStatus: "accepted",
    },
  });

  const careBooking = await prisma.careBooking.create({
    data: {
      careRequestId: request.id,
      bookingId: genericBooking.id,
      participantId: request.participantId,
      organisationId: request.assignedOrganisationId,
      status: "provider_accepted",
      scheduledStart: request.preferredDate,
      location: request.address,
      tasks: (request.tasks ?? []) as object,
      accessRequirementsSnapshot:
        request.shareAccessibility && request.accessRequirementsSummary
          ? { summary: request.accessRequirementsSummary }
          : undefined,
    },
  });

  await prisma.careRequest.update({
    where: { id: request.id },
    data: { bookingId: genericBooking.id, status: "confirmed" },
  });
  await recordCareBookingEvent({
    bookingId: careBooking.id,
    eventType: "provider_accepted",
    actorUserId: params.actorUserId,
  });

  return careBooking;
}

export async function updateCareBookingStatus(params: {
  bookingId: string;
  status: CareBookingStatus;
  actorUserId?: string;
  notes?: string;
}) {
  const booking = await prisma.careBooking.update({
    where: { id: params.bookingId },
    data: { status: params.status },
  });
  await recordCareBookingEvent({
    bookingId: params.bookingId,
    eventType: `status.${params.status}`,
    actorUserId: params.actorUserId,
    notes: params.notes,
  });
  return booking;
}

export async function listCareBookingsForUser(user: CurrentUser) {
  if (isAdminRole(user.primaryRole)) {
    return prisma.careBooking.findMany({ orderBy: { updatedAt: "desc" } });
  }
  if (user.primaryRole === "participant") {
    return prisma.careBooking.findMany({
      where: { participantId: user.id },
      orderBy: { updatedAt: "desc" },
    });
  }
  return prisma.careBooking.findMany({
    where: { organisation: { members: { some: { userId: user.id } } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCareBookingForUser(id: string, user: CurrentUser) {
  const booking = await prisma.careBooking.findUnique({
    where: { id },
    include: {
      careRequest: true,
      workers: { include: { workerProfile: true } },
      serviceLogs: true,
      accessNeeds: true,
      invoiceLinks: true,
    },
  });
  if (!booking) return null;
  await assertProviderCanAccessBooking(user, booking);
  return booking;
}

export async function assertCanCreateBookingForRequest(
  user: CurrentUser,
  careRequestId: string
) {
  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
  });
  if (!request) throw new Error("REQUEST_NOT_FOUND");
  await assertProviderCanAccessCareRequest(user, request);
  return request;
}
import type { CareBookingStatus, Prisma } from "@prisma/client";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import {
  assertParticipantOwnsBooking,
  assertProviderCanAccessBooking,
} from "@/lib/care/access-control";
import { prisma } from "@/lib/prisma";

function defaultStart(preferredDate: Date | null) {
  return preferredDate ?? new Date();
}

function defaultEnd(start: Date) {
  return new Date(start.getTime() + 60 * 60 * 1000);
}

export async function recordCareBookingEvent(params: {
  bookingId: string;
  actorUserId?: string;
  eventType: string;
  status?: CareBookingStatus;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.careBookingEvent.create({
    data: {
      bookingId: params.bookingId,
      actorUserId: params.actorUserId,
      eventType: params.eventType,
      status: params.status,
      title: params.title,
      description: params.description,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function createCareBookingForRequest(
  careRequestId: string,
  actorUserId: string
) {
  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
  });
  if (!request) throw new Error("REQUEST_NOT_FOUND");
  if (!request.assignedOrganisationId) throw new Error("ORG_REQUIRED");

  const start = defaultStart(request.preferredDate);
  const end = request.endTime ? undefined : defaultEnd(start);

  const genericBooking = request.bookingId
    ? await prisma.booking.findUnique({ where: { id: request.bookingId } })
    : await prisma.booking.create({
        data: {
          participantId: request.participantId,
          bookingType: "care",
          status: "confirmed",
          requestedStart: start,
          requestedEnd: end,
          careLocation: request.address,
          accessibilitySummary: request.shareAccessibility
            ? request.accessRequirementsSummary
            : undefined,
          participantNotes: request.description,
          assignedOrganisationId: request.assignedOrganisationId,
          fundingSourceId: request.fundingSourceId,
          shareAccessibility: request.shareAccessibility,
          createdById: actorUserId,
          providerResponseStatus: "accepted",
        },
      });

  if (!genericBooking) throw new Error("BOOKING_NOT_FOUND");

  const booking = await prisma.careBooking.upsert({
    where: { careRequestId },
    create: {
      careRequestId,
      bookingId: genericBooking.id,
      participantId: request.participantId,
      organisationId: request.assignedOrganisationId,
      status: "accepted",
      scheduledStart: start,
      scheduledEnd: end,
      location: request.address,
      tasks: request.tasks ?? [],
      accessRequirementsSnapshot: request.accessRequirementsSummary
        ? { summary: request.accessRequirementsSummary }
        : undefined,
    },
    update: {
      bookingId: genericBooking.id,
      status: "accepted",
      scheduledStart: start,
      scheduledEnd: end,
      location: request.address,
      tasks: request.tasks ?? [],
    },
  });

  await prisma.careRequest.update({
    where: { id: careRequestId },
    data: {
      bookingId: genericBooking.id,
      status: "confirmed",
    },
  });

  await recordCareBookingEvent({
    bookingId: booking.id,
    actorUserId,
    eventType: "provider_accepted",
    status: "accepted",
    title: "Care provider accepted request",
  });
  await createAuditEvent({
    actorUserId,
    action: "care_booking.created",
    entityType: "CareBooking",
    entityId: booking.id,
    participantId: booking.participantId,
    organisationId: booking.organisationId,
  });

  return booking;
}

export async function updateCareBookingStatus(params: {
  bookingId: string;
  status: CareBookingStatus;
  actorUserId: string;
  eventType: string;
  title: string;
}) {
  const booking = await prisma.careBooking.update({
    where: { id: params.bookingId },
    data: { status: params.status },
  });
  await recordCareBookingEvent({
    bookingId: booking.id,
    actorUserId: params.actorUserId,
    eventType: params.eventType,
    status: params.status,
    title: params.title,
  });
  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: `care_booking.${params.status}`,
    entityType: "CareBooking",
    entityId: booking.id,
    participantId: booking.participantId,
    organisationId: booking.organisationId,
  });
  return booking;
}

export async function listCareBookingsForUser(user: CurrentUser) {
  const where = isAdminRole(user.primaryRole)
    ? {}
    : user.primaryRole === "provider_admin"
      ? { organisationId: { in: await getUserOrganisationIds(user.id) } }
      : { participantId: user.id };

  return prisma.careBooking.findMany({
    where,
    include: {
      careRequest: true,
      workers: { include: { workerProfile: true }, where: { active: true } },
      serviceLogs: { orderBy: { createdAt: "desc" }, take: 3 },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCareBookingForUser(user: CurrentUser, bookingId: string) {
  const booking = await prisma.careBooking.findUnique({
    where: { id: bookingId },
    include: {
      careRequest: true,
      serviceAgreement: true,
      serviceLogs: { orderBy: { createdAt: "desc" } },
      workers: { include: { workerProfile: true } },
      shifts: { orderBy: { startAt: "asc" }, include: { workerProfile: true } },
      invoiceLinks: true,
      accessNeeds: true,
    },
  });
  if (!booking) throw new Error("BOOKING_NOT_FOUND");
  if (user.primaryRole === "provider_admin") {
    await assertProviderCanAccessBooking(user, booking);
  } else {
    assertParticipantOwnsBooking(user, booking);
  }
  return booking;
}
