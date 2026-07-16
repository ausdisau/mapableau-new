import { ZodError, z } from "zod";
import type { Prisma } from "@prisma/client";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { buildSandboxQuotes } from "@/lib/transport/transport-quote-adapter";
import { recordTripEvent } from "@/lib/transport/transport-event-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { assertStatusTransition } from "@/lib/transport/transport-status-service";

type Params = { params: Promise<{ tripId: string }> };

const bodySchema = z.object({
  sandboxQuoteId: z.string().min(1),
  idempotencyKey: z.string().min(8).max(128),
});

/** Participant-safe acceptance of a deterministic sandbox quote fixture. */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("transport:manage:self");
  if (user instanceof Response) return user;
  try {
    const { tripId } = await params;
    const body = bodySchema.parse(await req.json());

    const existingEvent = await prisma.transportTripEvent.findUnique({
      where: {
        tripId_idempotencyKey: {
          tripId,
          idempotencyKey: body.idempotencyKey,
        },
      },
    });
    if (existingEvent) {
      const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
      return jsonOk({ trip, replayed: true });
    }

    const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
    if (!trip || trip.participantId !== user.id) {
      throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
    }

    const orgId =
      trip.providerOrganisationId ??
      (await prisma.organisation.findFirst({ select: { id: true } }))?.id;
    if (!orgId) {
      throw new TransportApiError(
        "TRANSPORT_VALIDATION_FAILED",
        "No sandbox operator organisation configured"
      );
    }

    const fixtures = buildSandboxQuotes({
      mobilityRequirements: (trip.mobilityRequirements as Record<string, unknown>) ?? {},
      operatorOrganisationId: orgId,
    });
    const fixture = fixtures.find((f) => f.id === body.sandboxQuoteId);
    if (!fixture || fixture.accessFit === "fail") {
      throw new TransportApiError(
        "TRANSPORT_VALIDATION_FAILED",
        "Sandbox option not available or failed access fit"
      );
    }

    assertStatusTransition(trip.status, "participant_confirmed");

    const result = await prisma.$transaction(async (tx) => {
      const quote = await tx.transportQuote.create({
        data: {
          tripId,
          operatorOrganisationId: orgId,
          quoteSource: "sandbox",
          status: "accepted",
          estimatedDurationSeconds: fixture.estimatedDurationSeconds,
          estimatedDistanceMetres: fixture.estimatedDistanceMetres,
          fareBreakdownCents: fixture.fareBreakdownCents as unknown as Prisma.InputJsonValue,
          currency: "AUD",
          totalCents: fixture.totalCents,
          accessFit: fixture.accessFit,
          accessFitReasons: fixture.accessFitReasons as unknown as Prisma.InputJsonValue,
          isEstimate: true,
          sandbox: true,
          validUntil: new Date(fixture.validUntil),
          createdByUserId: user.id,
          idempotencyKey: body.idempotencyKey,
        },
      });

      const updated = await tx.transportTrip.update({
        where: { id: tripId },
        data: {
          status: "participant_confirmed",
          acceptedQuoteId: quote.id,
          providerOrganisationId: orgId,
          participantConfirmedAt: new Date(),
          fundingContext: {
            label: "Funding eligibility not verified",
            declared: "unsure",
            sandbox: true,
          } as Prisma.InputJsonValue,
        },
      });

      return { trip: updated, quote };
    });

    await recordTripEvent({
      tripId,
      actorUserId: user.id,
      eventType: "sandbox_quote_accepted",
      fromStatus: trip.status,
      toStatus: "participant_confirmed",
      metadata: {
        sandboxQuoteId: fixture.id,
        quoteId: result.quote.id,
        sandbox: true,
      },
      participantId: trip.participantId,
      organisationId: orgId,
      idempotencyKey: body.idempotencyKey,
    });

    return jsonOk(result);
  } catch (e) {
    if (e instanceof ZodError) return handleTransportRouteError(e);
    return handleTransportRouteError(e);
  }
}
