import type { NotificationTemplateKey } from "@prisma/client";

import { sendTransactionalNotification } from "@/lib/notifications/notification-service";
import {
  scheduleBookingReminder24h,
  scheduleBookingReminder2h,
} from "@/lib/notifications/scheduler-adapter";
import { format } from "date-fns";

export async function onBookingConfirmed(params: {
  userId: string;
  bookingId: string;
  requestedStart: Date;
  actorUserId?: string;
}) {
  const dateLabel = format(params.requestedStart, "d MMM yyyy, h:mm a");
  await sendTransactionalNotification({
    userId: params.userId,
    templateKey: "booking_confirmed",
    bookingId: params.bookingId,
    context: { dateLabel, bookingRef: params.bookingId.slice(-6) },
    actorUserId: params.actorUserId,
  });

  await scheduleBookingReminder24h({
    userId: params.userId,
    bookingId: params.bookingId,
    bookingStart: params.requestedStart,
  });
  await scheduleBookingReminder2h({
    userId: params.userId,
    bookingId: params.bookingId,
    bookingStart: params.requestedStart,
  });
}

export async function onTransportDriverAssigned(params: {
  userId: string;
  tripId: string;
  bookingId?: string;
  actorUserId?: string;
}) {
  return sendTransactionalNotification({
    userId: params.userId,
    templateKey: "transport_driver_assigned",
    tripId: params.tripId,
    bookingId: params.bookingId,
    actorUserId: params.actorUserId,
  });
}

export async function onTransportArriving(params: {
  userId: string;
  tripId: string;
  bookingId?: string;
  actorUserId?: string;
}) {
  return sendTransactionalNotification({
    userId: params.userId,
    templateKey: "transport_arriving",
    tripId: params.tripId,
    bookingId: params.bookingId,
    actorUserId: params.actorUserId,
  });
}

export async function onTripCompleted(params: {
  userId: string;
  tripId: string;
  bookingId?: string;
  actorUserId?: string;
}) {
  return sendTransactionalNotification({
    userId: params.userId,
    templateKey: "trip_completed",
    tripId: params.tripId,
    bookingId: params.bookingId,
    actorUserId: params.actorUserId,
  });
}

export async function onInvoiceIssued(params: {
  userId: string;
  invoiceId: string;
  invoiceRef?: string;
  actorUserId?: string;
}) {
  return sendTransactionalNotification({
    userId: params.userId,
    templateKey: "invoice_issued",
    invoiceId: params.invoiceId,
    context: { invoiceRef: params.invoiceRef ?? params.invoiceId.slice(-6) },
    actorUserId: params.actorUserId,
  });
}

export async function onInvoiceOverdue(params: {
  userId: string;
  invoiceId: string;
  invoiceRef?: string;
  actorUserId?: string;
}) {
  return sendTransactionalNotification({
    userId: params.userId,
    templateKey: "invoice_overdue",
    invoiceId: params.invoiceId,
    context: { invoiceRef: params.invoiceRef ?? params.invoiceId.slice(-6) },
    actorUserId: params.actorUserId,
  });
}

export function templateKeyForBookingStatus(
  status: string
): NotificationTemplateKey | null {
  if (status === "confirmed") return "booking_confirmed";
  return null;
}
