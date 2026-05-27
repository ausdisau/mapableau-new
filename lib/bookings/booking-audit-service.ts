import type { DataAccessReason, Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function logBookingAudit(params: {
  action: string;
  actorUserId: string;
  bookingId: string;
  participantId?: string;
  organisationId?: string;
  metadata?: Record<string, unknown>;
}) {
  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: params.action,
    entityType: "Booking",
    entityId: params.bookingId,
    participantId: params.participantId,
    organisationId: params.organisationId,
    metadata: params.metadata,
  });
}

export async function logBookingDataAccess(params: {
  actorUserId: string;
  bookingId: string;
  participantId?: string;
  reason: DataAccessReason;
  metadata?: Record<string, unknown>;
}) {
  await prisma.dataAccessLog.create({
    data: {
      actorUserId: params.actorUserId,
      entityType: "Booking",
      entityId: params.bookingId,
      bookingId: params.bookingId,
      participantId: params.participantId,
      reason: params.reason,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function logSensitiveBookingRead(params: {
  actorUserId: string;
  bookingId: string;
  participantId: string;
  includesAccessibility: boolean;
}) {
  await logBookingDataAccess({
    actorUserId: params.actorUserId,
    bookingId: params.bookingId,
    participantId: params.participantId,
    reason: "booking_view",
    metadata: {
      includesAccessibility: params.includesAccessibility,
    },
  });

  if (params.includesAccessibility) {
    await logBookingAudit({
      action: "booking.sensitive_read",
      actorUserId: params.actorUserId,
      bookingId: params.bookingId,
      participantId: params.participantId,
      metadata: { field: "accessibilitySummary" },
    });
  }
}
