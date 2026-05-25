import type { TransportMvpTripStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function recordTransportTripEvent(params: {
  tripId: string;
  fromStatus?: TransportMvpTripStatus | null;
  toStatus: TransportMvpTripStatus;
  message?: string;
  actorUserId?: string;
  participantId?: string;
  organisationId?: string;
}) {
  await prisma.transportTripEvent.create({
    data: {
      tripId: params.tripId,
      fromStatus: params.fromStatus ?? undefined,
      toStatus: params.toStatus,
      message: params.message,
      actorUserId: params.actorUserId,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "transport_trip.status_changed",
    entityType: "TransportTrip",
    entityId: params.tripId,
    participantId: params.participantId,
    organisationId: params.organisationId,
    metadata: {
      from: params.fromStatus,
      to: params.toStatus,
      message: params.message,
    },
  });
}
