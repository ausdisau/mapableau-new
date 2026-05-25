import { recordCareBookingEvent } from "@/lib/care/care-booking-service";
import { prisma } from "@/lib/prisma";

export async function createInvoicePlaceholderForBooking(params: {
  bookingId: string;
  actorUserId: string;
  pricingPlaceholder?: string;
  ndisLineItemCodePlaceholder?: string;
}) {
  const booking = await prisma.careBooking.findUnique({
    where: { id: params.bookingId },
    include: { serviceLogs: { where: { status: "confirmed" }, take: 1 } },
  });
  if (!booking) throw new Error("BOOKING_NOT_FOUND");
  const serviceLog = booking.serviceLogs[0];
  if (!serviceLog) throw new Error("SERVICE_LOG_REQUIRED");

  const link = await prisma.careInvoiceLink.create({
    data: {
      bookingId: booking.id,
      serviceLogId: serviceLog.id,
      organisationId: booking.organisationId,
      status: "placeholder",
      pricingPlaceholder:
        params.pricingPlaceholder ?? "Pricing to be confirmed by billing review.",
      ndisLineItemCodePlaceholder: params.ndisLineItemCodePlaceholder,
      createdById: params.actorUserId,
    },
  });
  await recordCareBookingEvent({
    bookingId: booking.id,
    eventType: "invoice_placeholder_created",
    actorUserId: params.actorUserId,
  });
  return link;
}
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordCareBookingEvent } from "@/lib/care/care-booking-service";
import { prisma } from "@/lib/prisma";

export async function createInvoicePlaceholderForBooking(params: {
  bookingId: string;
  actorUserId: string;
  pricingPlaceholder?: string;
  ndisLineItemCodePlaceholder?: string;
}) {
  const booking = await prisma.careBooking.findUnique({
    where: { id: params.bookingId },
    include: {
      serviceLogs: {
        where: { status: "confirmed" },
        orderBy: { confirmedAt: "desc" },
        take: 1,
      },
    },
  });
  if (!booking) throw new Error("BOOKING_NOT_FOUND");
  const confirmedLog = booking.serviceLogs[0];
  if (!confirmedLog) {
    await prisma.careInvoiceLink.create({
      data: {
        bookingId: booking.id,
        organisationId: booking.organisationId,
        status: "blocked_no_service_log",
        pricingPlaceholder: params.pricingPlaceholder,
        ndisLineItemCodePlaceholder: params.ndisLineItemCodePlaceholder,
        createdById: params.actorUserId,
      },
    });
    throw new Error("SERVICE_LOG_REQUIRED");
  }

  const link = await prisma.careInvoiceLink.upsert({
    where: { serviceLogId: confirmedLog.id },
    create: {
      bookingId: booking.id,
      serviceLogId: confirmedLog.id,
      organisationId: booking.organisationId,
      status: "placeholder",
      pricingPlaceholder: params.pricingPlaceholder,
      ndisLineItemCodePlaceholder: params.ndisLineItemCodePlaceholder,
      createdById: params.actorUserId,
    },
    update: {
      status: "placeholder",
      pricingPlaceholder: params.pricingPlaceholder,
      ndisLineItemCodePlaceholder: params.ndisLineItemCodePlaceholder,
    },
  });

  await recordCareBookingEvent({
    bookingId: booking.id,
    actorUserId: params.actorUserId,
    eventType: "invoice_placeholder_created",
    title: "Invoice placeholder created",
  });
  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "care_invoice_link.created",
    entityType: "CareInvoiceLink",
    entityId: link.id,
    participantId: booking.participantId,
    organisationId: booking.organisationId,
  });
  return link;
}
