import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordBookingTimelineEvent } from "@/lib/bookings/timeline-service";
import {
  assertBookingTransition,
  toCoreBookingStatus,
  toPrismaBookingStatus,
} from "@/lib/domain/booking-status";
import { notifyUserWithAction } from "@/lib/notifications/notification-service";
import {
  addWorkerToBookingThread,
  ensureBookingThread,
  postBookingSystemMessage,
} from "@/lib/orchestration/message-orchestrator";
import { prisma } from "@/lib/prisma";

export async function onBookingCreated(params: {
  bookingId: string;
  participantId: string;
  createdById: string;
  assignedOrganisationId?: string | null;
  bookingType: string;
  title?: string | null;
}) {
  const title =
    params.title ??
    `Booking — ${params.bookingType.replace("_", " + ")}`;

  const thread = await ensureBookingThread({
    bookingId: params.bookingId,
    participantId: params.participantId,
    organisationId: params.assignedOrganisationId,
    createdById: params.createdById,
    title,
  });

  await recordBookingTimelineEvent({
    bookingId: params.bookingId,
    eventType: "booking_created",
    title: "Booking request created",
    actorUserId: params.createdById,
  });

  await postBookingSystemMessage({
    bookingId: params.bookingId,
    senderUserId: params.createdById,
    body: "Your booking request has been submitted. You can use this thread to message your provider about this booking.",
    plainLanguageSummary: "Booking request submitted.",
  });

  if (params.assignedOrganisationId) {
    const members = await prisma.organisationMember.findMany({
      where: { organisationId: params.assignedOrganisationId },
      select: { userId: true },
      take: 20,
    });
    for (const m of members) {
      await notifyUserWithAction({
        userId: m.userId,
        category: "booking",
        notificationType: "booking_request_received",
        title: "New booking request",
        body: "A participant has requested support. Please review and respond.",
        actionUrl: `/provider/bookings/${params.bookingId}`,
      });
    }
  }

  return { threadId: thread.id };
}

export async function transitionBookingStatus(params: {
  bookingId: string;
  nextStatus: string;
  actorUserId: string;
  note?: string;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
  });
  if (!booking) throw new Error("BOOKING_NOT_FOUND");

  const currentCore = toCoreBookingStatus(booking.status);
  const nextCore = toCoreBookingStatus(params.nextStatus);
  assertBookingTransition(currentCore, nextCore);

  const updated = await prisma.booking.update({
    where: { id: params.bookingId },
    data: { status: toPrismaBookingStatus(nextCore) },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "booking.status_changed",
    entityType: "Booking",
    entityId: params.bookingId,
    participantId: booking.participantId,
    organisationId: booking.assignedOrganisationId ?? undefined,
    metadata: { from: booking.status, to: updated.status, note: params.note },
  });

  await recordBookingTimelineEvent({
    bookingId: params.bookingId,
    eventType: "booking_confirmed",
    title: `Booking status: ${nextCore}`,
    description: params.note,
    actorUserId: params.actorUserId,
  });

  await postBookingSystemMessage({
    bookingId: params.bookingId,
    senderUserId: params.actorUserId,
    body: `Booking status updated to ${nextCore.replace("_", " ")}.${params.note ? ` Note: ${params.note}` : ""}`,
    plainLanguageSummary: `Status is now ${nextCore}.`,
  });

  return updated;
}

export async function onBookingAccepted(params: {
  bookingId: string;
  actorUserId: string;
  organisationId: string;
  note?: string;
}) {
  const booking = await transitionBookingStatus({
    bookingId: params.bookingId,
    nextStatus: "accepted",
    actorUserId: params.actorUserId,
    note: params.note,
  });

  await prisma.booking.update({
    where: { id: params.bookingId },
    data: {
      providerResponseStatus: "accepted",
      providerResponseNote: params.note,
      providerRespondedAt: new Date(),
    },
  });

  await recordBookingTimelineEvent({
    bookingId: params.bookingId,
    eventType: "provider_accepted",
    title: "Provider accepted your booking",
    description: params.note,
    actorUserId: params.actorUserId,
  });

  await notifyUserWithAction({
    userId: booking.participantId,
    category: "booking",
    notificationType: "booking_accepted",
    title: "Booking accepted",
    body: "Your provider has accepted the booking request.",
    actionUrl: `/dashboard/bookings/${params.bookingId}`,
  });

  return booking;
}

export async function onBookingDeclined(params: {
  bookingId: string;
  actorUserId: string;
  organisationId: string;
  note?: string;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
  });
  if (!booking) throw new Error("BOOKING_NOT_FOUND");

  const updated = await prisma.booking.update({
    where: { id: params.bookingId },
    data: {
      status: "declined",
      providerResponseStatus: "declined",
      providerResponseNote: params.note,
      providerRespondedAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "booking.provider_declined",
    entityType: "Booking",
    entityId: params.bookingId,
    participantId: booking.participantId,
    organisationId: params.organisationId,
    metadata: { note: params.note },
  });

  await recordBookingTimelineEvent({
    bookingId: params.bookingId,
    eventType: "provider_declined",
    title: "Provider declined booking",
    description: params.note,
    actorUserId: params.actorUserId,
  });

  await postBookingSystemMessage({
    bookingId: params.bookingId,
    senderUserId: params.actorUserId,
    body: `The provider declined this booking.${params.note ? ` Reason: ${params.note}` : ""}`,
  });

  await notifyUserWithAction({
    userId: booking.participantId,
    category: "booking",
    notificationType: "booking_declined",
    title: "Booking declined",
    body: "Your booking request was declined by the provider.",
    actionUrl: `/dashboard/bookings/${params.bookingId}`,
  });

  return updated;
}

export async function onWorkerAssigned(params: {
  bookingId: string;
  workerUserId: string;
  actorUserId: string;
}) {
  const booking = await prisma.booking.update({
    where: { id: params.bookingId },
    data: { assignedWorkerId: params.workerUserId },
  });

  await addWorkerToBookingThread({
    bookingId: params.bookingId,
    workerUserId: params.workerUserId,
  });

  await recordBookingTimelineEvent({
    bookingId: params.bookingId,
    eventType: "worker_assigned",
    title: "Support worker assigned",
    actorUserId: params.actorUserId,
  });

  await postBookingSystemMessage({
    bookingId: params.bookingId,
    senderUserId: params.actorUserId,
    body: "A support worker has been assigned to this booking.",
    plainLanguageSummary: "Worker assigned.",
  });

  await notifyUserWithAction({
    userId: booking.participantId,
    category: "booking",
    notificationType: "worker_assigned",
    title: "Worker assigned",
    body: "A support worker has been assigned to your booking.",
    actionUrl: `/dashboard/bookings/${params.bookingId}`,
  });

  return booking;
}

export async function onServiceCompleted(params: {
  bookingId: string;
  actorUserId: string;
  actualStartAt: Date;
  actualEndAt: Date;
  completionNotes?: string;
  deliveredSupports?: unknown;
  actualTotalCents?: number;
}) {
  const updated = await prisma.booking.update({
    where: { id: params.bookingId },
    data: {
      status: "completed",
      actualStartAt: params.actualStartAt,
      actualEndAt: params.actualEndAt,
      completionNotes: params.completionNotes,
      deliveredSupports: params.deliveredSupports as object | undefined,
      actualTotalCents: params.actualTotalCents,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "booking.completed",
    entityType: "Booking",
    entityId: params.bookingId,
    participantId: updated.participantId,
    organisationId: updated.assignedOrganisationId ?? undefined,
  });

  await recordBookingTimelineEvent({
    bookingId: params.bookingId,
    eventType: "service_completed",
    title: "Service completed",
    description: params.completionNotes,
    actorUserId: params.actorUserId,
  });

  await postBookingSystemMessage({
    bookingId: params.bookingId,
    senderUserId: params.actorUserId,
    body: "Service has been marked as completed. The provider can now create an invoice.",
    plainLanguageSummary: "Service completed.",
  });

  await notifyUserWithAction({
    userId: updated.participantId,
    category: "booking",
    notificationType: "service_completed",
    title: "Service completed",
    body: "Your support session has been marked complete.",
    actionUrl: `/dashboard/bookings/${params.bookingId}`,
  });

  return updated;
}
