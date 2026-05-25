import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import {
  buildWwcContextForTransportBooking,
  resolveWorkerProfileIdForDriver,
} from "@/lib/verification/wwc/build-wwc-booking-context";
import { canWorkerPerformChildRelatedSupport } from "@/lib/verification/wwc/wwc-eligibility-service";
import { requiresWwcForBooking } from "@/lib/verification/wwc/wwc-requirement-rules";

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
  _actorUserId: string
) {
  const booking = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
  });
  if (!booking) throw new Error("NOT_FOUND");

  const wwcContext = await buildWwcContextForTransportBooking(booking);
  if (requiresWwcForBooking(wwcContext)) {
    const workerProfileId =
      await resolveWorkerProfileIdForDriver(driverProfileId);
    if (!workerProfileId) {
      throw new Error("WWC_REQUIRED_NO_WORKER_PROFILE");
    }
    const eligibility = await canWorkerPerformChildRelatedSupport(
      workerProfileId,
      wwcContext
    );
    if (!eligibility.allowed) {
      throw new Error("WWC_NOT_ELIGIBLE_FOR_CHILD_TRANSPORT");
    }
  }

  return prisma.transportBooking.update({
    where: { id: transportBookingId },
    data: { driverProfileId, status: "driver_assigned" },
  });
}

export async function assignVehicleToTransport(
  transportBookingId: string,
  vehicleId: string,
  _actorUserId: string
) {
  return prisma.transportBooking.update({
    where: { id: transportBookingId },
    data: { vehicleId, status: "vehicle_assigned" },
  });
}

export async function declineTransportBooking(
  id: string,
  _actorUserId: string
) {
  return prisma.transportBooking.update({
    where: { id },
    data: { status: "cancelled" },
  });
}
