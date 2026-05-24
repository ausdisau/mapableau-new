import { addHours } from "date-fns";

import type { NotificationTemplateKey } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type ScheduleNotificationInput = {
  userId: string;
  templateKey: NotificationTemplateKey;
  scheduledFor: Date;
  bookingId?: string;
  tripId?: string;
  invoiceId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Queues a future notification event. A cron/worker can process rows where
 * status=pending and scheduledFor <= now. No full scheduler is bundled here.
 */
export async function scheduleNotificationEvent(
  input: ScheduleNotificationInput
) {
  return prisma.notificationEvent.create({
    data: {
      userId: input.userId,
      templateKey: input.templateKey,
      status: "scheduled",
      scheduledFor: input.scheduledFor,
      bookingId: input.bookingId,
      tripId: input.tripId,
      invoiceId: input.invoiceId,
      metadata: input.metadata as object | undefined,
    },
  });
}

export async function scheduleBookingReminder24h(params: {
  userId: string;
  bookingId: string;
  bookingStart: Date;
}) {
  const scheduledFor = addHours(params.bookingStart, -24);
  if (scheduledFor <= new Date()) {
    return null;
  }
  return scheduleNotificationEvent({
    userId: params.userId,
    templateKey: "booking_reminder_24h",
    scheduledFor,
    bookingId: params.bookingId,
    metadata: { bookingStart: params.bookingStart.toISOString() },
  });
}

export async function scheduleBookingReminder2h(params: {
  userId: string;
  bookingId: string;
  bookingStart: Date;
}) {
  const scheduledFor = addHours(params.bookingStart, -2);
  if (scheduledFor <= new Date()) {
    return null;
  }
  return scheduleNotificationEvent({
    userId: params.userId,
    templateKey: "booking_reminder_2h",
    scheduledFor,
    bookingId: params.bookingId,
    metadata: { bookingStart: params.bookingStart.toISOString() },
  });
}

export async function listDueScheduledEvents(limit = 50) {
  return prisma.notificationEvent.findMany({
    where: {
      status: "scheduled",
      scheduledFor: { lte: new Date() },
    },
    orderBy: { scheduledFor: "asc" },
    take: limit,
  });
}
