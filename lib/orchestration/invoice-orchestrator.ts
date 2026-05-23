import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordBookingTimelineEvent } from "@/lib/bookings/timeline-service";
import {
  assertInvoiceTransition,
  toCoreInvoiceStatus,
  toPrismaInvoiceStatus,
} from "@/lib/domain/invoice-status";
import { postBookingSystemMessage } from "@/lib/orchestration/message-orchestrator";
import { notifyUserWithAction } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

export async function onInvoiceIssued(params: {
  invoiceId: string;
  actorUserId: string;
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    include: { booking: true },
  });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");

  if (invoice.bookingId) {
    await postBookingSystemMessage({
      bookingId: invoice.bookingId,
      senderUserId: params.actorUserId,
      body: `Invoice ${invoice.invoiceNumber ?? invoice.id} has been issued. Please review and approve when ready.`,
      plainLanguageSummary: "Invoice issued.",
    }).catch(() => null);
  }

  if (invoice.bookingId) {
    await recordBookingTimelineEvent({
      bookingId: invoice.bookingId,
      eventType: "invoice_issued",
      title: "Invoice issued",
      actorUserId: params.actorUserId,
      isAdminOnly: false,
    });
  }

  await notifyUserWithAction({
    userId: invoice.participantId,
    category: "billing",
    notificationType: "invoice_issued",
    title: "Invoice ready for review",
    body: "An invoice has been issued for your recent support.",
    actionUrl: `/dashboard/invoices/${invoice.id}`,
  });
}

export async function onInvoiceApproved(params: {
  invoiceId: string;
  actorUserId: string;
  nextStatus: "awaiting_plan_manager" | "awaiting_participant_approval";
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
  });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");

  assertInvoiceTransition(invoice.status, params.nextStatus);

  const updated = await prisma.invoice.update({
    where: { id: params.invoiceId },
    data: { status: toPrismaInvoiceStatus(params.nextStatus) },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "invoice.approved",
    entityType: "Invoice",
    entityId: invoice.id,
    participantId: invoice.participantId,
    metadata: { status: updated.status },
  });

  await notifyUserWithAction({
    userId: invoice.participantId,
    category: "billing",
    notificationType: "invoice_approved",
    title: "Invoice approved",
    body: "Thank you. Your invoice approval has been recorded.",
    actionUrl: `/dashboard/invoices/${invoice.id}`,
  });

  return updated;
}

export async function onInvoicePaid(params: {
  invoiceId: string;
  actorUserId: string;
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    include: { booking: true },
  });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");

  assertInvoiceTransition(invoice.status, "paid");

  const updated = await prisma.invoice.update({
    where: { id: params.invoiceId },
    data: {
      status: "paid",
      paidAt: new Date(),
    },
  });

  if (invoice.bookingId) {
    await prisma.booking.update({
      where: { id: invoice.bookingId },
      data: { status: "paid" },
    });

    await recordBookingTimelineEvent({
      bookingId: invoice.bookingId,
      eventType: "invoice_paid",
      title: "Invoice paid",
      actorUserId: params.actorUserId,
    });

    await postBookingSystemMessage({
      bookingId: invoice.bookingId,
      senderUserId: params.actorUserId,
      body: "Payment received. This booking is now marked as paid.",
      plainLanguageSummary: "Invoice paid.",
    });
  }

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "invoice.paid",
    entityType: "Invoice",
    entityId: invoice.id,
    participantId: invoice.participantId,
    metadata: { bookingId: invoice.bookingId },
  });

  await notifyUserWithAction({
    userId: invoice.participantId,
    category: "billing",
    notificationType: "payment_received",
    title: "Payment received",
    body: "Your invoice payment has been received.",
    actionUrl: `/dashboard/invoices/${invoice.id}`,
  });

  return updated;
}

export async function onInvoiceCreatedFromBooking(params: {
  invoiceId: string;
  bookingId: string;
  actorUserId: string;
}) {
  await prisma.booking.update({
    where: { id: params.bookingId },
    data: { status: "invoiced" },
  });

  await recordBookingTimelineEvent({
    bookingId: params.bookingId,
    eventType: "invoice_drafted",
    title: "Invoice created from booking",
    actorUserId: params.actorUserId,
  });

  await postBookingSystemMessage({
    bookingId: params.bookingId,
    senderUserId: params.actorUserId,
    body: "An invoice draft has been created for this booking.",
    plainLanguageSummary: "Invoice draft created.",
  });
}

export function coreInvoiceStatus(status: string) {
  return toCoreInvoiceStatus(status);
}

/** Phase 3 care-shift invoicing (preserved for existing orchestration API). */
export { createInvoiceLinesFromApprovedCareShift } from "@/lib/orchestration/invoice-orchestrator-care-shift";
