import type { BookingStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function recordBookingEvent(params: {
  bookingId: string;
  eventType: string;
  title: string;
  description?: string;
  fromStatus?: BookingStatus | null;
  toStatus?: BookingStatus | null;
  actorUserId?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.bookingEvent.create({
    data: {
      bookingId: params.bookingId,
      eventType: params.eventType,
      title: params.title,
      description: params.description,
      fromStatus: params.fromStatus ?? null,
      toStatus: params.toStatus ?? null,
      actorUserId: params.actorUserId,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function listBookingEvents(bookingId: string) {
  return prisma.bookingEvent.findMany({
    where: { bookingId },
    orderBy: { createdAt: "asc" },
    include: {
      actor: { select: { id: true, name: true } },
    },
  });
}

export async function recordStatusChangeEvent(params: {
  bookingId: string;
  fromStatus: BookingStatus;
  toStatus: BookingStatus;
  actorUserId?: string;
  note?: string;
}) {
  return recordBookingEvent({
    bookingId: params.bookingId,
    eventType: "status_changed",
    title: `Booking status changed to ${params.toStatus.replace(/_/g, " ")}`,
    description: params.note,
    fromStatus: params.fromStatus,
    toStatus: params.toStatus,
    actorUserId: params.actorUserId,
  });
}
