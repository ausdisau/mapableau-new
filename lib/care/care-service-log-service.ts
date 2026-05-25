import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { recordCareBookingEvent, updateCareBookingStatus } from "@/lib/care/care-booking-service";
import { prisma } from "@/lib/prisma";

export async function createServiceLogDraftForShift(shiftId: string) {
  const shift = await prisma.careShift.findUnique({ where: { id: shiftId } });
  if (!shift) throw new Error("SHIFT_NOT_FOUND");
  if (!shift.careBookingId) throw new Error("BOOKING_NOT_FOUND");
  return prisma.careServiceLog.upsert({
    where: { shiftId },
    create: {
      bookingId: shift.careBookingId,
      shiftId,
      participantId: shift.participantId,
      organisationId: shift.organisationId,
      workerProfileId: shift.workerProfileId,
      status: "draft",
      startedAt: shift.checkInTime ?? shift.startAt,
      endedAt: shift.checkOutTime ?? shift.endAt,
      supportItems: shift.tasks as object,
    },
    update: {},
  });
}

export async function submitServiceLogFromShift(params: {
  shiftId: string;
  actorUserId: string;
  supportItems?: unknown;
  tasksCompleted?: unknown;
  workerNotes?: string;
}) {
  const draft = await createServiceLogDraftForShift(params.shiftId);
  const log = await prisma.careServiceLog.update({
    where: { id: draft.id },
    data: {
      status: "submitted",
      supportItems: (params.supportItems ?? draft.supportItems) as object,
      tasksCompleted: (params.tasksCompleted ?? []) as object,
      workerNotes: params.workerNotes,
      submittedAt: new Date(),
    },
  });
  await updateCareBookingStatus({
    bookingId: log.bookingId,
    status: "awaiting_participant_confirmation",
    actorUserId: params.actorUserId,
  });
  return log;
}

export async function confirmServiceLog(params: {
  serviceLogId: string;
  participantId: string;
  notes?: string;
}) {
  const log = await prisma.careServiceLog.update({
    where: { id: params.serviceLogId, participantId: params.participantId },
    data: {
      status: "confirmed",
      participantNotes: params.notes,
      confirmedById: params.participantId,
      confirmedAt: new Date(),
    },
  });
  await updateCareBookingStatus({
    bookingId: log.bookingId,
    status: "completed",
    actorUserId: params.participantId,
  });
  return log;
}

export async function disputeServiceLog(params: {
  serviceLogId: string;
  participantId: string;
  reason: string;
}) {
  const log = await prisma.careServiceLog.update({
    where: { id: params.serviceLogId, participantId: params.participantId },
    data: {
      status: "disputed",
      disputeReason: params.reason,
      disputedAt: new Date(),
    },
  });
  await recordCareBookingEvent({
    bookingId: log.bookingId,
    eventType: "service_log_disputed",
    actorUserId: params.participantId,
    notes: params.reason,
  });
  return log;
}

export async function listServiceLogsForUser(user: CurrentUser) {
  if (isAdminRole(user.primaryRole)) {
    return prisma.careServiceLog.findMany({ orderBy: { createdAt: "desc" } });
  }
  if (user.primaryRole === "participant") {
    return prisma.careServiceLog.findMany({
      where: { participantId: user.id },
      orderBy: { createdAt: "desc" },
    });
  }
  if (user.primaryRole === "support_worker") {
    return prisma.careServiceLog.findMany({
      where: { workerProfile: { userId: user.id } },
      orderBy: { createdAt: "desc" },
    });
  }
  return prisma.careServiceLog.findMany({
    where: { organisation: { members: { some: { userId: user.id } } } },
    orderBy: { createdAt: "desc" },
  });
}
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordCareBookingEvent } from "@/lib/care/care-booking-service";
import { prisma } from "@/lib/prisma";

async function getWorkerShift(shiftId: string, workerUserId: string) {
  const shift = await prisma.careShift.findUnique({
    where: { id: shiftId },
    include: { workerProfile: true },
  });
  if (!shift) throw new Error("SHIFT_NOT_FOUND");
  if (shift.workerProfile?.userId !== workerUserId) {
    throw new Error("FORBIDDEN");
  }
  if (!shift.careBookingId) throw new Error("BOOKING_REQUIRED");
  return shift;
}

export async function createServiceLogDraftForShift(
  shiftId: string,
  workerUserId: string
) {
  const shift = await getWorkerShift(shiftId, workerUserId);
  const log = await prisma.careServiceLog.upsert({
    where: { shiftId },
    create: {
      bookingId: shift.careBookingId,
      shiftId: shift.id,
      participantId: shift.participantId,
      organisationId: shift.organisationId,
      workerProfileId: shift.workerProfileId,
      status: "draft",
      startedAt: shift.checkInTime,
      endedAt: shift.checkOutTime,
      tasksCompleted: [],
    },
    update: {
      startedAt: shift.checkInTime,
      endedAt: shift.checkOutTime,
    },
  });
  return log;
}

export async function submitServiceLogFromShift(params: {
  shiftId: string;
  workerUserId: string;
  workerNotes?: string;
  tasksCompleted?: unknown[];
  supportItems?: unknown[];
}) {
  const shift = await getWorkerShift(params.shiftId, params.workerUserId);
  const log = await prisma.careServiceLog.upsert({
    where: { shiftId: shift.id },
    create: {
      bookingId: shift.careBookingId,
      shiftId: shift.id,
      participantId: shift.participantId,
      organisationId: shift.organisationId,
      workerProfileId: shift.workerProfileId,
      status: "submitted",
      startedAt: shift.checkInTime,
      endedAt: shift.checkOutTime ?? new Date(),
      supportItems: params.supportItems ?? [],
      tasksCompleted: params.tasksCompleted ?? [],
      workerNotes: params.workerNotes,
      submittedAt: new Date(),
    },
    update: {
      status: "submitted",
      supportItems: params.supportItems ?? [],
      tasksCompleted: params.tasksCompleted ?? [],
      workerNotes: params.workerNotes,
      submittedAt: new Date(),
      endedAt: shift.checkOutTime ?? new Date(),
    },
  });

  await prisma.careShift.update({
    where: { id: shift.id },
    data: { status: "awaiting_participant_approval" },
  });
  await recordCareBookingEvent({
    bookingId: log.bookingId,
    actorUserId: params.workerUserId,
    eventType: "service_log_submitted",
    title: "Worker submitted service log",
  });
  await createAuditEvent({
    actorUserId: params.workerUserId,
    action: "care_service_log.submitted",
    entityType: "CareServiceLog",
    entityId: log.id,
    participantId: log.participantId,
    organisationId: log.organisationId,
  });

  return log;
}

export async function confirmServiceLog(params: {
  serviceLogId: string;
  participantId: string;
  feedback?: string;
}) {
  const existing = await prisma.careServiceLog.findUnique({
    where: { id: params.serviceLogId },
  });
  if (!existing || existing.participantId !== params.participantId) {
    throw new Error("SERVICE_LOG_NOT_FOUND");
  }
  const log = await prisma.careServiceLog.update({
    where: { id: params.serviceLogId },
    data: {
      status: "confirmed",
      participantFeedback: params.feedback,
      confirmedById: params.participantId,
      confirmedAt: new Date(),
    },
  });
  if (log.shiftId) {
    await prisma.careShift.update({
      where: { id: log.shiftId },
      data: {
        status: "approved",
        participantApprovalStatus: "approved",
        approvedById: params.participantId,
        approvedAt: new Date(),
      },
    });
  }
  await recordCareBookingEvent({
    bookingId: log.bookingId,
    actorUserId: params.participantId,
    eventType: "service_log_confirmed",
    title: "Participant confirmed service log",
  });
  await createAuditEvent({
    actorUserId: params.participantId,
    action: "care_service_log.confirmed",
    entityType: "CareServiceLog",
    entityId: log.id,
    participantId: log.participantId,
    organisationId: log.organisationId,
  });
  return log;
}

export async function disputeServiceLog(params: {
  serviceLogId: string;
  participantId: string;
  reason: string;
}) {
  const existing = await prisma.careServiceLog.findUnique({
    where: { id: params.serviceLogId },
  });
  if (!existing || existing.participantId !== params.participantId) {
    throw new Error("SERVICE_LOG_NOT_FOUND");
  }
  const log = await prisma.careServiceLog.update({
    where: { id: params.serviceLogId },
    data: {
      status: "disputed",
      disputeReason: params.reason,
      disputedById: params.participantId,
      disputedAt: new Date(),
    },
  });
  if (log.shiftId) {
    await prisma.careShift.update({
      where: { id: log.shiftId },
      data: { status: "disputed", participantApprovalStatus: "disputed" },
    });
  }
  await recordCareBookingEvent({
    bookingId: log.bookingId,
    actorUserId: params.participantId,
    eventType: "service_log_disputed",
    status: "disputed",
    title: "Participant disputed service log",
  });
  await createAuditEvent({
    actorUserId: params.participantId,
    action: "care_service_log.disputed",
    entityType: "CareServiceLog",
    entityId: log.id,
    participantId: log.participantId,
    organisationId: log.organisationId,
  });
  return log;
}

export async function listServiceLogsForUser(user: CurrentUser) {
  const where = isAdminRole(user.primaryRole)
    ? {}
    : user.primaryRole === "provider_admin"
      ? { organisationId: { in: await getUserOrganisationIds(user.id) } }
      : user.primaryRole === "support_worker"
        ? { workerProfile: { userId: user.id } }
        : { participantId: user.id };

  return prisma.careServiceLog.findMany({
    where,
    include: {
      booking: { include: { careRequest: true } },
      workerProfile: true,
      shift: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
