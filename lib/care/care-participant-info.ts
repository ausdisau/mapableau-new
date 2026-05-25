import { prisma } from "@/lib/prisma";

export async function getWorkerShiftParticipantInfo(params: {
  shiftId: string;
  workerUserId: string;
}) {
  const shift = await prisma.careShift.findFirst({
    where: { id: params.shiftId, workerProfile: { userId: params.workerUserId } },
    include: {
      careRequest: true,
      careBooking: { include: { accessNeeds: true, livingAloneSafeguards: true } },
    },
  });
  if (!shift) throw new Error("SHIFT_NOT_FOUND");
  return {
    shiftId: shift.id,
    participantId: shift.participantId,
    location: shift.location,
    request: {
      title: shift.careRequest.title,
      tasks: shift.tasks,
      communicationNotes: shift.careRequest.communicationNotes,
      accessRequirementsSummary: shift.careRequest.shareAccessibility
        ? shift.careRequest.accessRequirementsSummary
        : null,
    },
    accessNeeds: shift.careBooking?.accessNeeds ?? [],
    safeguards: shift.careBooking?.livingAloneSafeguards ?? [],
  };
}
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function getWorkerShiftParticipantInfo(params: {
  shiftId: string;
  workerUserId: string;
}) {
  const shift = await prisma.careShift.findUnique({
    where: { id: params.shiftId },
    include: {
      workerProfile: true,
      careRequest: {
        select: {
          id: true,
          title: true,
          requestType: true,
          tasks: true,
          communicationNotes: true,
          accessRequirementsSummary: true,
          shareAccessibility: true,
        },
      },
    },
  });
  if (!shift) throw new Error("SHIFT_NOT_FOUND");
  if (shift.workerProfile?.userId !== params.workerUserId) {
    throw new Error("FORBIDDEN");
  }

  await createAuditEvent({
    actorUserId: params.workerUserId,
    action: "care_participant_info.worker_viewed",
    entityType: "CareShift",
    entityId: shift.id,
    participantId: shift.participantId,
    organisationId: shift.organisationId,
  });

  return {
    shiftId: shift.id,
    participantId: shift.participantId,
    location: shift.location,
    scheduledStart: shift.startAt,
    scheduledEnd: shift.endAt,
    request: {
      id: shift.careRequest.id,
      title: shift.careRequest.title,
      requestType: shift.careRequest.requestType,
      tasks: shift.careRequest.tasks,
      communicationNotes: shift.careRequest.communicationNotes,
      accessRequirementsSummary: shift.careRequest.shareAccessibility
        ? shift.careRequest.accessRequirementsSummary
        : null,
    },
  };
}
