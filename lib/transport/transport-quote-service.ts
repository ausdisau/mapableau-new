import type { Prisma } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { recordTripEvent } from "@/lib/transport/transport-event-service";
import { buildSandboxQuotes } from "@/lib/transport/transport-quote-adapter";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { assertStatusTransition } from "@/lib/transport/transport-status-service";
import type { createOperatorQuoteSchema } from "@/lib/validation/transport-quote-schemas";
import type { z } from "zod";

type CreateQuoteInput = z.infer<typeof createOperatorQuoteSchema> & {
  operatorOrganisationId: string;
};

export async function listSandboxQuotesForTrip(
  user: CurrentUser,
  tripId: string
) {
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip || trip.participantId !== user.id) {
    throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  }
  const orgId =
    trip.providerOrganisationId ??
    (await prisma.organisation.findFirst({ select: { id: true } }))?.id;
  if (!orgId) {
    return { quotes: [], source: "sandbox" as const, sandbox: true };
  }
  const quotes = buildSandboxQuotes({
    mobilityRequirements: (trip.mobilityRequirements as Record<string, unknown>) ?? {},
    operatorOrganisationId: orgId,
  });
  return { quotes, source: "sandbox" as const, sandbox: true, advisory: true };
}

export async function createOperatorQuote(
  user: CurrentUser,
  input: CreateQuoteInput
) {
  if (input.idempotencyKey) {
    const existing = await prisma.transportQuote.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) return existing;
  }

  const quote = await prisma.transportQuote.create({
    data: {
      tripId: input.tripId,
      tripRequestId: input.tripRequestId,
      operatorOrganisationId: input.operatorOrganisationId,
      proposedDriverId: input.proposedDriverId,
      proposedVehicleId: input.proposedVehicleId,
      quoteSource: "operator",
      status: "offered",
      estimatedPickupStart: input.estimatedPickupStart
        ? new Date(input.estimatedPickupStart)
        : undefined,
      estimatedPickupEnd: input.estimatedPickupEnd
        ? new Date(input.estimatedPickupEnd)
        : undefined,
      estimatedDurationSeconds: input.estimatedDurationSeconds,
      estimatedDistanceMetres: input.estimatedDistanceMetres,
      fareBreakdownCents: input.fareBreakdownCents as Prisma.InputJsonValue,
      currency: input.currency ?? "AUD",
      totalCents: input.totalCents,
      isEstimate: input.isEstimate ?? false,
      sandbox: false,
      validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
      cancellationTermsRef: input.cancellationTermsRef,
      createdByUserId: user.id,
      idempotencyKey: input.idempotencyKey,
      accessFit: "manual_review",
      accessFitReasons: ["Operator-confirmed quote awaiting access-fit review"] as unknown as Prisma.InputJsonValue,
    },
  });

  if (input.tripId) {
    const trip = await prisma.transportTrip.findUnique({ where: { id: input.tripId } });
    if (trip) {
      assertStatusTransition(trip.status, "quote_available");
      await prisma.transportTrip.update({
        where: { id: input.tripId },
        data: { status: "quote_available" },
      });
      await recordTripEvent({
        tripId: input.tripId,
        actorUserId: user.id,
        eventType: "quote_offered",
        fromStatus: trip.status,
        toStatus: "quote_available",
        metadata: { quoteId: quote.id, sandbox: false },
        participantId: trip.participantId,
        organisationId: input.operatorOrganisationId,
        idempotencyKey: `quote-offered-${quote.id}`,
      });
    }
  }

  return quote;
}

export async function acceptQuote(
  user: CurrentUser,
  quoteId: string,
  idempotencyKey: string
) {
  const quote = await prisma.transportQuote.findUnique({ where: { id: quoteId } });
  if (!quote || !quote.tripId) {
    throw new TransportApiError("TRANSPORT_VALIDATION_FAILED");
  }

  const trip = await prisma.transportTrip.findUnique({ where: { id: quote.tripId } });
  if (!trip || trip.participantId !== user.id) {
    throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  }

  if (quote.status === "accepted" && trip.acceptedQuoteId === quote.id) {
    return { trip, quote };
  }

  if (quote.validUntil && quote.validUntil < new Date()) {
    throw new TransportApiError("TRANSPORT_VALIDATION_FAILED", "Quote has expired");
  }

  if (quote.accessFit === "fail") {
    throw new TransportApiError(
      "TRANSPORT_VALIDATION_FAILED",
      "Cannot accept a failed access-fit quote"
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.transportQuote.update({
      where: { id: quoteId },
      data: { status: "accepted" },
    });
    assertStatusTransition(trip.status, "participant_confirmed");
    const next = await tx.transportTrip.update({
      where: { id: trip.id },
      data: {
        status: "participant_confirmed",
        acceptedQuoteId: quoteId,
        providerOrganisationId: quote.operatorOrganisationId,
        participantConfirmedAt: new Date(),
      },
    });
    return next;
  });

  await recordTripEvent({
    tripId: trip.id,
    actorUserId: user.id,
    eventType: "quote_accepted",
    fromStatus: trip.status,
    toStatus: "participant_confirmed",
    metadata: { quoteId, sandbox: quote.sandbox },
    participantId: trip.participantId,
    organisationId: quote.operatorOrganisationId,
    idempotencyKey,
  });

  await prisma.transportAttestation.create({
    data: {
      tripId: trip.id,
      actorUserId: user.id,
      claimType: "quote_acceptance",
      payloadHash: `sha256:quote:${quoteId}:${idempotencyKey}`,
      evidenceRefs: [{ quoteId }] as unknown as Prisma.InputJsonValue,
    },
  });

  return { trip: updated, quote };
}
