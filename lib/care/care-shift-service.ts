import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordBookingTimelineEvent } from "@/lib/bookings/timeline-service";
import { syncCalendarForCareShift } from "@/lib/calendar/calendar-service";
import { prisma } from "@/lib/prisma";
import { buildWwcContextForCareRequest } from "@/lib/verification/wwc/build-wwc-booking-context";
import { canWorkerPerformChildRelatedSupport } from "@/lib/verification/wwc/wwc-eligibility-service";
import { requiresWwcForBooking } from "@/lib/verification/wwc/wwc-requirement-rules";

export async function createCareShiftFromRequest(params: {
  careRequestId: string;
  organisationId: string;
  startAt: Date;
  endAt: Date;
  location?: string;
  workerProfileId?: string;
  createdById: string;
}) {
  const request = await prisma.careRequest.findUnique({
    where: { id: params.careRequestId },
    include: {
      participant: { include: { participantProfile: true } },
    },
  });
  if (!request) throw new Error("NOT_FOUND");

  if (params.workerProfileId) {
    const wwcContext = await buildWwcContextForCareRequest(request);
    if (requiresWwcForBooking(wwcContext)) {
      const eligibility = await canWorkerPerformChildRelatedSupport(
        params.workerProfileId,
        wwcContext
      );
      if (!eligibility.allowed) {
        throw new Error("WWC_NOT_ELIGIBLE_FOR_CHILD_SUPPORT");
      }
    }
  }

  const shift = await prisma.careShift.create({
    data: {
      careRequestId: params.careRequestId,
      bookingId: request.bookingId,
      participantId: request.participantId,
      organisationId: params.organisationId,
      workerProfileId: params.workerProfileId,
      startAt: params.startAt,
      endAt: params.endAt,
      location: params.location ?? request.address,
      tasks: request.tasks ?? [],
      accessRequirementsSnapshot: request.accessRequirementsSummary
        ? { summary: request.accessRequirementsSummary }
        : {},
      status: params.workerProfileId ? "worker_assigned" : "scheduled",
    },
  });

  await syncCalendarForCareShift(shift, params.createdById);
  await createAuditEvent({
    actorUserId: params.createdById,
    action: "care_shift.created",
    entityType: "CareShift",
    entityId: shift.id,
    participantId: shift.participantId,
  });

  return shift;
}

export async function careShiftCheckIn(shiftId: string, actorUserId: string) {
  const shift = await prisma.careShift.update({
    where: { id: shiftId },
    data: { status: "checked_in", checkInTime: new Date() },
  });
  await createAuditEvent({
    actorUserId,
    action: "care_shift.check_in",
    entityType: "CareShift",
    entityId: shiftId,
    participantId: shift.participantId,
  });
  return shift;
}

export async function careShiftCheckOut(shiftId: string, actorUserId: string) {
  const shift = await prisma.careShift.update({
    where: { id: shiftId },
    data: {
      status: "awaiting_participant_approval",
      checkOutTime: new Date(),
    },
  });
  await createAuditEvent({
    actorUserId,
    action: "care_shift.check_out",
    entityType: "CareShift",
    entityId: shiftId,
    participantId: shift.participantId,
  });
  return shift;
}

export async function approveCareShift(shiftId: string, participantId: string) {
  const shift = await prisma.careShift.update({
    where: { id: shiftId },
    data: {
      status: "approved",
      participantApprovalStatus: "approved",
      approvedById: participantId,
      approvedAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId: participantId,
    action: "care_shift.approved",
    entityType: "CareShift",
    entityId: shiftId,
    participantId: shift.participantId,
  });

  if (shift.bookingId) {
    await recordBookingTimelineEvent({
      bookingId: shift.bookingId,
      eventType: "booking_completed",
      title: "Care shift approved by participant",
      actorUserId: participantId,
    });
  }

  return shift;
}
