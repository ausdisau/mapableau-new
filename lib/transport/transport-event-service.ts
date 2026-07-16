import type { Prisma, TransportTripStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { AV_BILLING_HOLD_STATUSES } from "@/lib/av-framework/trip-transitions";

export async function recordTripEvent(params: {
  tripId: string;
  actorUserId?: string;
  eventType: string;
  fromStatus?: TransportTripStatus | null;
  toStatus?: TransportTripStatus | null;
  message?: string;
  metadata?: Record<string, unknown>;
  participantId?: string;
  organisationId?: string;
  idempotencyKey?: string;
  locationPrecision?: string;
  occurredAt?: Date;
}) {
  if (params.idempotencyKey) {
    const existing = await prisma.transportTripEvent.findUnique({
      where: {
        tripId_idempotencyKey: {
          tripId: params.tripId,
          idempotencyKey: params.idempotencyKey,
        },
      },
    });
    if (existing) return existing;
  }

  // Never persist exact addresses in event metadata
  const safeMetadata = params.metadata
    ? Object.fromEntries(
        Object.entries(params.metadata).filter(
          ([key]) =>
            !/address|lat|lng|coordinate|ndis|diagnosis/i.test(key)
        )
      )
    : undefined;

  const event = await prisma.transportTripEvent.create({
    data: {
      tripId: params.tripId,
      actorUserId: params.actorUserId,
      fromStatus: params.fromStatus ?? undefined,
      toStatus: params.toStatus ?? undefined,
      eventType: params.eventType,
      message: params.message,
      metadata: (safeMetadata ?? undefined) as Prisma.InputJsonValue | undefined,
      idempotencyKey: params.idempotencyKey,
      locationPrecision: params.locationPrecision,
      occurredAt: params.occurredAt ?? new Date(),
      receivedAt: new Date(),
    },
  });

  if (
    params.toStatus &&
    AV_BILLING_HOLD_STATUSES.includes(params.toStatus)
  ) {
    await prisma.transportTrip.update({
      where: { id: params.tripId },
      data: {
        billingHold: true,
        billingHoldReason: `Status ${params.toStatus}`,
      },
    });
  }

  if (params.actorUserId) {
    await createAuditEvent({
      actorUserId: params.actorUserId,
      action: `transport_trip.${params.eventType}`,
      entityType: "TransportTrip",
      entityId: params.tripId,
      participantId: params.participantId,
      organisationId: params.organisationId,
      metadata: {
        fromStatus: params.fromStatus,
        toStatus: params.toStatus,
        ...safeMetadata,
      },
    });
  }

  return event;
}
