import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { validateAssignment } from "@/lib/transport-osm/dispatch/assignment-validator";
import { transitionTripStatus } from "@/lib/transport-osm/trip-status-service";

export async function manualDispatchAssign(params: {
  transportBookingId: string;
  driverProfileId: string;
  vehicleId: string;
  actorUserId: string;
  force?: boolean;
}) {
  const booking = await prisma.transportBooking.findUnique({
    where: { id: params.transportBookingId },
  });
  if (!booking) throw new Error("NOT_FOUND");

  const validation = await validateAssignment({
    booking,
    driverProfileId: params.driverProfileId,
    vehicleId: params.vehicleId,
  });

  if (!validation.ok && !params.force) {
    throw new Error(`ASSIGNMENT_INVALID:${validation.errors.join("; ")}`);
  }

  const updated = await prisma.transportBooking.update({
    where: { id: params.transportBookingId },
    data: {
      driverProfileId: params.driverProfileId,
      vehicleId: params.vehicleId,
    },
  });

  if (
    booking.status === "provider_accepted" ||
    booking.status === "participant_confirmed"
  ) {
    await transitionTripStatus({
      transportBookingId: params.transportBookingId,
      toStatus: "driver_assigned",
      actorUserId: params.actorUserId,
      reason: "manual_dispatch",
      metadata: { warnings: validation.warnings },
    });
  }

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "dispatch.assigned",
    entityType: "TransportBooking",
    entityId: params.transportBookingId,
    metadata: {
      driverProfileId: params.driverProfileId,
      vehicleId: params.vehicleId,
      warnings: validation.warnings,
    },
  });

  return { booking: updated, validation };
}
