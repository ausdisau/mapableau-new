import type { BookingAssigneeRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  assertWorkerEligibleForBooking,
  loadWorkerForEligibility,
} from "@/lib/care/worker-eligibility";
import { statusForAssignment } from "@/lib/bookings/booking-status-service";
import { recordStatusChangeEvent } from "@/lib/bookings/booking-event-service";
import { logBookingAudit } from "@/lib/bookings/booking-audit-service";

async function assertDriverEligible(
  userId: string,
  organisationId: string
): Promise<void> {
  const driver = await prisma.driverProfile.findFirst({
    where: { userId, organisationId, active: true },
  });
  if (!driver) throw new Error("BOOKING_ASSIGNEE_NOT_ELIGIBLE");
  if (driver.verificationStatus !== "verified") {
    throw new Error("BOOKING_ASSIGNEE_NOT_ELIGIBLE");
  }
}

async function assertPractitionerEligible(
  userId: string,
  organisationId: string
): Promise<void> {
  const worker = await prisma.workerProfile.findFirst({
    where: { userId, organisationId, active: true },
  });
  if (!worker) throw new Error("BOOKING_ASSIGNEE_NOT_ELIGIBLE");
  assertWorkerEligibleForBooking(worker, {
    organisationId,
    tasks: [],
  });
}

export async function assertAssigneeEligible(params: {
  assigneeUserId: string;
  assigneeRole: BookingAssigneeRole;
  organisationId: string;
  bookingTasks?: unknown;
}): Promise<void> {
  try {
    if (params.assigneeRole === "worker") {
      const worker = await prisma.workerProfile.findFirst({
        where: {
          userId: params.assigneeUserId,
          organisationId: params.organisationId,
        },
      });
      if (!worker) throw new Error("BOOKING_ASSIGNEE_NOT_ELIGIBLE");
      assertWorkerEligibleForBooking(worker, {
        organisationId: params.organisationId,
        tasks: params.bookingTasks ?? [],
      });
      return;
    }

    if (params.assigneeRole === "driver") {
      await assertDriverEligible(params.assigneeUserId, params.organisationId);
      return;
    }

    if (params.assigneeRole === "practitioner") {
      await assertPractitionerEligible(
        params.assigneeUserId,
        params.organisationId
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("BOOKING_")) {
      throw error;
    }
    throw new Error("BOOKING_ASSIGNEE_NOT_ELIGIBLE");
  }
}

export async function assignBookingWorker(params: {
  bookingId: string;
  assigneeUserId: string;
  assigneeRole: BookingAssigneeRole;
  organisationId: string;
  assignedById: string;
  notes?: string;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
  });
  if (!booking) throw new Error("BOOKING_NOT_FOUND");

  await assertAssigneeEligible({
    assigneeUserId: params.assigneeUserId,
    assigneeRole: params.assigneeRole,
    organisationId: params.organisationId,
  });

  await prisma.bookingAssignment.updateMany({
    where: {
      bookingId: params.bookingId,
      assigneeRole: params.assigneeRole,
      active: true,
    },
    data: { active: false, unassignedAt: new Date() },
  });

  const assignment = await prisma.bookingAssignment.create({
    data: {
      bookingId: params.bookingId,
      assigneeUserId: params.assigneeUserId,
      assigneeRole: params.assigneeRole,
      assignedById: params.assignedById,
      organisationId: params.organisationId,
      notes: params.notes,
    },
  });

  const nextStatus = statusForAssignment(booking.status);
  const updateData: Record<string, unknown> = {
    status: nextStatus,
  };

  if (params.assigneeRole === "worker") {
    updateData.assignedWorkerId = params.assigneeUserId;
  } else if (params.assigneeRole === "driver") {
    updateData.assignedDriverId = params.assigneeUserId;
  } else if (params.assigneeRole === "practitioner") {
    updateData.assignedPractitionerId = params.assigneeUserId;
  }

  const updated = await prisma.booking.update({
    where: { id: params.bookingId },
    data: updateData,
    include: {
      assignments: { where: { active: true } },
    },
  });

  if (nextStatus !== booking.status) {
    await recordStatusChangeEvent({
      bookingId: params.bookingId,
      fromStatus: booking.status,
      toStatus: nextStatus,
      actorUserId: params.assignedById,
      note: params.notes,
    });
  }

  await logBookingAudit({
    action: "booking.assigned",
    actorUserId: params.assignedById,
    bookingId: params.bookingId,
    participantId: booking.participantId,
    organisationId: params.organisationId,
    metadata: {
      assigneeUserId: params.assigneeUserId,
      assigneeRole: params.assigneeRole,
    },
  });

  return { booking: updated, assignment };
}

export async function loadWorkerForAssignment(workerProfileId: string) {
  return loadWorkerForEligibility(workerProfileId);
}
