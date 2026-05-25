import { recordCareBookingEvent, updateCareBookingStatus } from "@/lib/care/care-booking-service";
import { assertWorkerEligibleForBooking } from "@/lib/care/worker-eligibility";
import { prisma } from "@/lib/prisma";

export async function assignWorkerToCareBooking(params: {
  bookingId: string;
  workerProfileId: string;
  actorUserId: string;
  startAt?: Date;
  endAt?: Date;
  notes?: string;
}) {
  const { booking, worker } = await assertWorkerEligibleForBooking({
    bookingId: params.bookingId,
    workerProfileId: params.workerProfileId,
  });

  const assignment = await prisma.careBookingWorker.upsert({
    where: {
      bookingId_workerProfileId: {
        bookingId: params.bookingId,
        workerProfileId: params.workerProfileId,
      },
    },
    create: {
      bookingId: params.bookingId,
      workerProfileId: params.workerProfileId,
      assignedById: params.actorUserId,
      notes: params.notes,
    },
    update: { active: true, notes: params.notes },
  });

  const startAt = params.startAt ?? booking.scheduledStart ?? new Date();
  const endAt = params.endAt ?? booking.scheduledEnd ?? new Date(startAt.getTime() + 60 * 60 * 1000);
  const shift = await prisma.careShift.create({
    data: {
      careRequestId: booking.careRequestId,
      careBookingId: booking.id,
      bookingId: booking.bookingId,
      participantId: booking.participantId,
      organisationId: booking.organisationId,
      workerProfileId: worker.id,
      startAt,
      endAt,
      location: booking.location,
      tasks: booking.tasks as object,
      accessRequirementsSnapshot: booking.accessRequirementsSnapshot as object | undefined,
      status: "worker_assigned",
    },
  });

  await updateCareBookingStatus({
    bookingId: booking.id,
    status: "worker_assigned",
    actorUserId: params.actorUserId,
    notes: params.notes,
  });
  await prisma.careRequest.update({
    where: { id: booking.careRequestId },
    data: { assignedWorkerProfileId: worker.id, status: "matched" },
  });
  await recordCareBookingEvent({
    bookingId: booking.id,
    eventType: "worker_assigned",
    actorUserId: params.actorUserId,
  });

  return { assignment, shift };
}
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordCareBookingEvent } from "@/lib/care/care-booking-service";
import { assertWorkerEligibleForBooking } from "@/lib/care/worker-eligibility";
import { prisma } from "@/lib/prisma";

function fallbackEnd(start: Date) {
  return new Date(start.getTime() + 2 * 60 * 60 * 1000);
}

export async function assignWorkerToCareBooking(params: {
  bookingId: string;
  workerProfileId: string;
  actorUserId: string;
  notes?: string;
}) {
  const { booking, worker } = await assertWorkerEligibleForBooking({
    bookingId: params.bookingId,
    workerProfileId: params.workerProfileId,
  });

  const assignment = await prisma.careBookingWorker.upsert({
    where: {
      bookingId_workerProfileId: {
        bookingId: booking.id,
        workerProfileId: worker.id,
      },
    },
    create: {
      bookingId: booking.id,
      workerProfileId: worker.id,
      assignedById: params.actorUserId,
      notes: params.notes,
    },
    update: {
      active: true,
      assignedById: params.actorUserId,
      assignedAt: new Date(),
      notes: params.notes,
    },
  });

  const startAt = booking.scheduledStart ?? new Date();
  const endAt = booking.scheduledEnd ?? fallbackEnd(startAt);

  const shift = await prisma.careShift.upsert({
    where: { id: `care-shift-${booking.id}` },
    create: {
      id: `care-shift-${booking.id}`,
      careRequestId: booking.careRequestId,
      bookingId: booking.bookingId,
      careBookingId: booking.id,
      participantId: booking.participantId,
      organisationId: booking.organisationId,
      workerProfileId: worker.id,
      startAt,
      endAt,
      location: booking.location,
      tasks: booking.tasks,
      accessRequirementsSnapshot: booking.accessRequirementsSnapshot,
      status: "worker_assigned",
    },
    update: {
      workerProfileId: worker.id,
      careBookingId: booking.id,
      startAt,
      endAt,
      location: booking.location,
      tasks: booking.tasks,
      status: "worker_assigned",
    },
  });

  await prisma.careRosterAssignment.create({
    data: {
      organisationId: booking.organisationId,
      bookingId: booking.id,
      workerProfileId: worker.id,
      startAt,
      endAt,
      status: "assigned",
      notes: params.notes,
    },
  });

  await prisma.careBooking.update({
    where: { id: booking.id },
    data: { status: "worker_assigned" },
  });

  await prisma.careRequest.update({
    where: { id: booking.careRequestId },
    data: { assignedWorkerProfileId: worker.id, status: "matched" },
  });

  await recordCareBookingEvent({
    bookingId: booking.id,
    actorUserId: params.actorUserId,
    eventType: "worker_assigned",
    status: "worker_assigned",
    title: "Worker assigned to care booking",
    metadata: { workerProfileId: worker.id },
  });
  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "care_booking.worker_assigned",
    entityType: "CareBooking",
    entityId: booking.id,
    participantId: booking.participantId,
    organisationId: booking.organisationId,
    metadata: { workerProfileId: worker.id, shiftId: shift.id },
  });

  return { assignment, shift };
}
