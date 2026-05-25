import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { syncBookingStatusForTransportBooking } from "@/lib/bookings/status-sync";
import { prisma } from "@/lib/prisma";

export async function createDriverProfile(params: {
  userId: string;
  organisationId: string;
  displayName: string;
  phone?: string;
  serviceRegions?: string[];
  actorUserId: string;
}) {
  const driver = await prisma.driverProfile.create({
    data: {
      userId: params.userId,
      organisationId: params.organisationId,
      displayName: params.displayName,
      phone: params.phone,
      serviceRegions: params.serviceRegions ?? [],
      licenceStatus: "not_provided",
      accessibilityTrainingStatus: "not_provided",
      verificationStatus: "pending_review",
      active: true,
    },
  });
  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "driver_profile.created",
    entityType: "DriverProfile",
    entityId: driver.id,
    organisationId: params.organisationId,
  });
  return driver;
}

export async function assignDriverToTransport(
  transportBookingId: string,
  driverProfileId: string,
  _actorUserId: string,
) {
  const booking = await prisma.transportBooking.update({
    where: { id: transportBookingId },
    data: { driverProfileId, status: "driver_assigned" },
  });
  await syncBookingStatusForTransportBooking(transportBookingId, _actorUserId);
  return booking;
}

export async function assignVehicleToTransport(
  transportBookingId: string,
  vehicleId: string,
  _actorUserId: string,
) {
  const booking = await prisma.transportBooking.update({
    where: { id: transportBookingId },
    data: { vehicleId, status: "vehicle_assigned" },
  });
  await syncBookingStatusForTransportBooking(transportBookingId, _actorUserId);
  return booking;
}

export async function declineTransportBooking(
  id: string,
  _actorUserId: string,
) {
  const booking = await prisma.transportBooking.update({
    where: { id },
    data: { status: "cancelled" },
  });
  await syncBookingStatusForTransportBooking(id, _actorUserId);
  return booking;
}
