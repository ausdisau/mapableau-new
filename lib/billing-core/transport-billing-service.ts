import { createDraftInvoice } from "@/lib/billing-core/invoice-service";
import { recordUsageEvent } from "@/lib/usage/usage-ledger";
import { prisma } from "@/lib/prisma";

const DEFAULT_TRANSPORT_FARE_CENTS = 4500;

export async function createBillingInvoiceFromTransportTrip(tripId: string) {
  const trip = await prisma.transportTrip.findUnique({
    where: { id: tripId },
    include: { tripRequest: true },
  });
  if (!trip) return { ok: false as const, error: "Trip not found" };
  if (trip.status !== "trip_completed" && trip.status !== "closed") {
    return { ok: false as const, error: "Trip not completed" };
  }

  const linkedBooking = await prisma.booking.findFirst({
    where: { transportTripId: tripId },
    select: { id: true },
  });
  const bookingId = linkedBooking?.id ?? trip.legacyTransportBookingId ?? undefined;

  const existing = await prisma.billingInvoice.findFirst({
    where: { bookingId, serviceType: "transport" },
  });
  if (existing) return { ok: true as const, invoiceId: existing.id, duplicate: true };

  const lineItems = [
    {
      description: `Accessible transport: ${trip.tripRequest?.pickupSuburb ?? "pickup"} to ${trip.tripRequest?.dropoffSuburb ?? "dropoff"}`,
      quantity: 1,
      unitAmountCents: DEFAULT_TRANSPORT_FARE_CENTS,
      gstApplicable: true,
    },
  ];

  const invoice = await createDraftInvoice(trip.participantId, {
    providerId: trip.providerOrganisationId ?? undefined,
    bookingId,
    serviceType: "transport",
    lineItems,
  });

  await recordUsageEvent({
    category: "module_completion",
    eventType: "transport.trip_billed",
    userId: trip.participantId,
    organisationId: trip.providerOrganisationId ?? undefined,
    entityType: "BillingInvoice",
    entityId: invoice.id,
    metadata: { tripId },
  });

  return { ok: true as const, invoiceId: invoice.id };
}
