import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { TransportApiError } from "@/lib/transport/transport-api-error";

export async function createTransportComplaint(
  user: CurrentUser | null,
  input: {
    tripId?: string;
    summary: string;
    details?: string;
    anonymous?: boolean;
    advocateInvolved?: boolean;
  }
) {
  if (input.tripId && user) {
    const trip = await prisma.transportTrip.findUnique({
      where: { id: input.tripId },
    });
    if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
    if (trip.participantId !== user.id) {
      throw new TransportApiError("TRANSPORT_ACCESS_DENIED");
    }
  }

  const acknowledgementDueAt = new Date();
  acknowledgementDueAt.setDate(acknowledgementDueAt.getDate() + 2);

  return prisma.transportComplaint.create({
    data: {
      participantId: input.anonymous ? null : user?.id,
      tripId: input.tripId,
      anonymous: input.anonymous ?? false,
      summary: input.summary,
      details: input.details,
      advocateInvolved: input.advocateInvolved ?? false,
      status: "received",
      acknowledgementDueAt,
    },
  });
}
