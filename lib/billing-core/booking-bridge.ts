import type { BookingType } from "@prisma/client";

import { writeBillingAuditLog } from "@/lib/billing-core/audit";
import { createDraftInvoice } from "@/lib/billing-core/invoice-service";
import { prisma } from "@/lib/prisma";

function serviceTypeForBooking(bookingType: BookingType) {
  switch (bookingType) {
    case "transport":
    case "care_transport":
      return "transport" as const;
    default:
      return "care" as const;
  }
}

function defaultUnitAmountCents(bookingType: BookingType): number {
  switch (bookingType) {
    case "transport":
      return 8500;
    case "care_transport":
      return 18000;
    default:
      return 12000;
  }
}

/**
 * Creates a billing-core draft invoice with platform fee totals from a booking.
 * Idempotent when a billing invoice already exists for the booking.
 */
export async function createBillingDraftFromBooking(
  bookingId: string,
  actorUserId: string,
) {
  const existing = await prisma.billingInvoice.findFirst({
    where: { bookingId },
  });
  if (existing) return existing;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { assignedOrganisation: true },
  });
  if (!booking) throw new Error("BOOKING_NOT_FOUND");

  const unitAmountCents = defaultUnitAmountCents(booking.bookingType);
  const description = `Support service — ${booking.bookingType.replace("_", " ")}`;

  const invoice = await createDraftInvoice(booking.participantId, {
    providerId: booking.assignedOrganisationId ?? undefined,
    bookingId: booking.id,
    serviceType: serviceTypeForBooking(booking.bookingType),
    fundingSourceId: undefined,
    lineItems: [
      {
        description,
        quantity: 1,
        unitAmountCents,
        gstApplicable: false,
      },
    ],
  });

  await writeBillingAuditLog({
    actorUserId,
    entityType: "BillingInvoice",
    entityId: invoice.id,
    action: "booking_bridge_created",
    after: { bookingId, platformFeeCents: invoice.platformFeeCents },
  });

  return invoice;
}
