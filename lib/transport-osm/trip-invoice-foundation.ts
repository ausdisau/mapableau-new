import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { transitionTripStatus } from "@/lib/transport-osm/trip-status-service";
import type { FareBreakdown } from "@/types/transport-osm";

export async function createDraftInvoiceFromTrip(
  transportBookingId: string,
  actorUserId: string
) {
  const booking = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
    include: {
      tripQuotes: {
        where: { status: "accepted" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!booking) throw new Error("NOT_FOUND");
  if (booking.status !== "completed") {
    throw new Error("TRIP_NOT_COMPLETED");
  }

  const existing = await prisma.invoice.findFirst({
    where: { transportBookingId },
  });
  if (existing) return existing;

  const quote = booking.tripQuotes[0];
  const fare = (quote?.fareBreakdown ?? ({
    totalCents: booking.quotedFareCents ?? 0,
    baseCents: 0,
    distanceCents: 0,
    currency: "AUD",
  })) as unknown as FareBreakdown;

  const totalCents = fare.totalCents || booking.quotedFareCents || 0;

  const invoice = await prisma.invoice.create({
    data: {
      participantId: booking.participantId,
      organisationId: booking.operatorOrganisationId,
      transportBookingId,
      bookingId: booking.bookingId,
      status: "draft",
      subtotalCents: totalCents,
      totalCents,
      taxCents: 0,
      currency: fare.currency ?? "AUD",
      notes: "Transport trip invoice (draft)",
      createdById: actorUserId,
      lines: {
        create: [
          {
            description: "Accessible transport trip",
            serviceDate: booking.pickupWindowStart,
            quantity: 1,
            unitAmountCents: totalCents,
            totalAmountCents: totalCents,
            bookingId: booking.bookingId ?? undefined,
          },
        ],
      },
    },
  });

  await transitionTripStatus({
    transportBookingId,
    toStatus: "invoiced",
    actorUserId,
    reason: "invoice_drafted",
  });

  await createAuditEvent({
    actorUserId,
    action: "transport.invoice_drafted",
    entityType: "Invoice",
    entityId: invoice.id,
    participantId: booking.participantId,
  });

  return invoice;
}
