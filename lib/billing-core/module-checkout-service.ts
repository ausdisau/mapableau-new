import { addDays } from "date-fns";

import { createCheckoutForInvoice } from "@/lib/billing-core/checkout-service";
import { createDraftInvoice } from "@/lib/billing-core/invoice-service";
import { prisma } from "@/lib/prisma";

const CARE_HOURLY_RATE_CENTS = 6500;
const TRANSPORT_BASE_FARE_CENTS = 2000;
const TRANSPORT_PER_MINUTE_CENTS = 120;

function normalizeMoney(cents: number) {
  return Math.max(500, Math.round(cents));
}

async function defaultFundingSourceIdForUser(userId: string) {
  const preferred = await prisma.billingFundingSource.findFirst({
    where: { userId, isDefault: true },
    orderBy: { createdAt: "asc" },
  });
  if (preferred) return preferred.id;
  const fallback = await prisma.billingFundingSource.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return fallback?.id;
}

export async function createCareBookingCheckout(userId: string, careBookingId: string) {
  const booking = await prisma.careBooking.findFirst({
    where: { id: careBookingId, participantId: userId },
    include: {
      serviceLogs: {
        where: { status: "confirmed" },
        orderBy: { submittedAt: "desc" },
        take: 1,
      },
    },
  });
  if (!booking) {
    return { ok: false as const, error: "Care booking not found" };
  }

  const existing = await prisma.billingInvoice.findFirst({
    where: {
      userId,
      legacyInvoiceId: `careBooking:${careBookingId}`,
      status: { not: "paid" },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    return createCheckoutForInvoice(userId, existing.id);
  }

  const durationMinutes = booking.serviceLogs[0]?.durationMinutes ?? 60;
  const amountCents = normalizeMoney((durationMinutes / 60) * CARE_HOURLY_RATE_CENTS);
  const fundingSourceId = await defaultFundingSourceIdForUser(userId);

  const invoice = await createDraftInvoice(userId, {
    providerId: booking.organisationId,
    serviceType: "care",
    fundingSourceId,
    dueAt: addDays(new Date(), 7).toISOString(),
    lineItems: [
      {
        description: "Care support session",
        quantity: 1,
        unitAmountCents: amountCents,
        ndisLineItem: "care_support",
      },
    ],
  });

  await prisma.billingInvoice.update({
    where: { id: invoice.id },
    data: { legacyInvoiceId: `careBooking:${careBookingId}` },
  });

  return createCheckoutForInvoice(userId, invoice.id);
}

export async function createTransportTripCheckout(userId: string, tripId: string) {
  const trip = await prisma.transportTrip.findFirst({
    where: { id: tripId, participantId: userId },
  });
  if (!trip) {
    return { ok: false as const, error: "Transport trip not found" };
  }

  const existing = await prisma.billingInvoice.findFirst({
    where: {
      userId,
      legacyInvoiceId: `transportTrip:${tripId}`,
      status: { not: "paid" },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    return createCheckoutForInvoice(userId, existing.id);
  }

  const durationMs = Math.max(
    0,
    (trip.scheduledEnd ?? trip.scheduledStart).getTime() - trip.scheduledStart.getTime()
  );
  const durationMinutes = Math.max(1, Math.ceil(durationMs / 60000));
  const amountCents = normalizeMoney(
    TRANSPORT_BASE_FARE_CENTS + durationMinutes * TRANSPORT_PER_MINUTE_CENTS
  );
  const fundingSourceId = await defaultFundingSourceIdForUser(userId);

  const invoice = await createDraftInvoice(userId, {
    providerId: trip.providerOrganisationId ?? undefined,
    serviceType: "transport",
    fundingSourceId,
    dueAt: addDays(new Date(), 7).toISOString(),
    lineItems: [
      {
        description: "Transport trip service",
        quantity: 1,
        unitAmountCents: amountCents,
        ndisLineItem: "transport_trip",
      },
    ],
  });

  await prisma.billingInvoice.update({
    where: { id: invoice.id },
    data: { legacyInvoiceId: `transportTrip:${tripId}` },
  });

  return createCheckoutForInvoice(userId, invoice.id);
}
