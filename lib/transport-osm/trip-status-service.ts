import type { TransportBookingStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";
import { TRANSPORT_STATUS_LABELS } from "@/types/transport-osm";

const ALLOWED: Partial<Record<TransportBookingStatus, TransportBookingStatus[]>> = {
  draft: ["quote_requested", "cancelled"],
  quote_requested: ["quoted", "cancelled"],
  quoted: ["participant_confirmed", "cancelled", "late_risk"],
  participant_confirmed: ["provider_accepted", "cancelled"],
  provider_accepted: ["driver_assigned", "cancelled"],
  driver_assigned: ["vehicle_dispatched", "cancelled", "late_risk"],
  vehicle_dispatched: ["arrived_at_pickup", "late_risk", "cancelled", "no_show"],
  arrived_at_pickup: ["passenger_onboard", "access_issue", "no_show", "cancelled"],
  passenger_onboard: ["arrived_at_destination", "access_issue", "incident_reported"],
  arrived_at_destination: ["completed", "access_issue", "incident_reported"],
  completed: ["invoiced", "disputed"],
  invoiced: ["paid", "disputed"],
  late_risk: ["vehicle_dispatched", "arrived_at_pickup", "cancelled", "no_show"],
  access_issue: ["cancelled", "completed", "incident_reported"],
  incident_reported: ["cancelled", "completed", "disputed"],
  paid: [],
  cancelled: [],
  disputed: ["cancelled", "completed"],
  no_show: ["cancelled", "disputed"],
};

export async function transitionTripStatus(params: {
  transportBookingId: string;
  toStatus: TransportBookingStatus;
  actorUserId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}) {
  const tb = await prisma.transportBooking.findUnique({
    where: { id: params.transportBookingId },
    include: { driverProfile: true, participant: true },
  });
  if (!tb) throw new Error("NOT_FOUND");

  const from = tb.status;
  const allowed = ALLOWED[from] ?? [];
  if (!allowed.includes(params.toStatus) && from !== params.toStatus) {
    throw new Error("INVALID_TRANSITION");
  }

  const updated = await prisma.transportBooking.update({
    where: { id: params.transportBookingId },
    data: { status: params.toStatus },
  });

  await prisma.dispatchEvent.create({
    data: {
      transportBookingId: params.transportBookingId,
      fromStatus: from,
      toStatus: params.toStatus,
      actorUserId: params.actorUserId,
      reason: params.reason,
      metadata: params.metadata ? (params.metadata as object) : undefined,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "transport.status_changed",
    entityType: "TransportBooking",
    entityId: params.transportBookingId,
    participantId: tb.participantId,
    metadata: { from, to: params.toStatus, reason: params.reason },
  });

  const label = TRANSPORT_STATUS_LABELS[params.toStatus];
  await notifyUser(
    tb.participantId,
    "booking",
    "Trip status updated",
    `Your transport trip is now: ${label}.`
  );

  if (tb.driverProfile?.userId) {
    await notifyUser(
      tb.driverProfile.userId,
      "booking",
      "Trip status updated",
      `Trip update: ${label}.`
    );
  }

  return updated;
}
