import type { ServiceLogStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

const LOCKED: ServiceLogStatus[] = ["approved", "locked"];

export async function createServiceLogFromBooking(
  bookingId: string,
  createdById: string,
  input: {
    serviceDate: string;
    startTime?: string;
    endTime?: string;
    durationMinutes?: number;
    serviceSummary: string;
    supportItemCode?: string;
    travelMinutes?: number;
    travelKm?: number;
  }
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });
  if (!booking) throw new Error("NOT_FOUND");
  if (!["accepted", "confirmed", "completed", "in_progress"].includes(booking.status)) {
    throw new Error("BOOKING_NOT_READY");
  }
  if (!booking.assignedOrganisationId) throw new Error("NO_PROVIDER");

  const log = await prisma.serviceLog.create({
    data: {
      bookingId,
      organisationId: booking.assignedOrganisationId,
      participantId: booking.participantId,
      serviceDate: new Date(input.serviceDate),
      startTime: input.startTime,
      endTime: input.endTime,
      durationMinutes: input.durationMinutes,
      serviceSummary: input.serviceSummary,
      supportItemCode: input.supportItemCode,
      travelMinutes: input.travelMinutes,
      travelKm: input.travelKm,
      createdById,
      status: "draft",
    },
  });

  await prisma.serviceLogEvent.create({
    data: {
      serviceLogId: log.id,
      eventType: "created",
      actorUserId: createdById,
    },
  });

  await createAuditEvent({
    actorUserId: createdById,
    action: "booking.updated",
    entityType: "service_logs",
    entityId: log.id,
    participantId: booking.participantId,
    organisationId: booking.assignedOrganisationId,
  });

  return log;
}

export async function submitServiceLog(
  serviceLogId: string,
  actorUserId: string
) {
  const log = await prisma.serviceLog.update({
    where: { id: serviceLogId },
    data: { status: "participant_review" },
  });

  await prisma.serviceLogEvent.create({
    data: {
      serviceLogId,
      eventType: "submitted",
      actorUserId,
    },
  });

  return log;
}

export async function participantApproveServiceLog(
  serviceLogId: string,
  participantId: string
) {
  const log = await prisma.serviceLog.findUnique({
    where: { id: serviceLogId },
  });
  if (!log || log.participantId !== participantId) throw new Error("FORBIDDEN");
  if (LOCKED.includes(log.status)) throw new Error("LOCKED");

  const updated = await prisma.serviceLog.update({
    where: { id: serviceLogId },
    data: { status: "approved" },
  });

  await prisma.serviceLogApproval.upsert({
    where: { serviceLogId },
    create: {
      serviceLogId,
      participantId,
      approvedAt: new Date(),
    },
    update: { approvedAt: new Date(), disputedAt: null, disputeReason: null },
  });

  await prisma.serviceLogEvent.create({
    data: {
      serviceLogId,
      eventType: "approved",
      actorUserId: participantId,
    },
  });

  await createAuditEvent({
    actorUserId: participantId,
    action: "booking.updated",
    entityType: "service_logs",
    entityId: serviceLogId,
    participantId,
  });

  return updated;
}

export async function participantDisputeServiceLog(
  serviceLogId: string,
  participantId: string,
  reason: string
) {
  const log = await prisma.serviceLog.findUnique({
    where: { id: serviceLogId },
  });
  if (!log || log.participantId !== participantId) throw new Error("FORBIDDEN");

  const updated = await prisma.serviceLog.update({
    where: { id: serviceLogId },
    data: { status: "disputed" },
  });

  await prisma.serviceLogApproval.upsert({
    where: { serviceLogId },
    create: {
      serviceLogId,
      participantId,
      disputedAt: new Date(),
      disputeReason: reason,
    },
    update: {
      disputedAt: new Date(),
      disputeReason: reason,
      approvedAt: null,
    },
  });

  await prisma.serviceLogEvent.create({
    data: {
      serviceLogId,
      eventType: "disputed",
      actorUserId: participantId,
      note: reason,
    },
  });

  return updated;
}

export function canGenerateInvoiceFromServiceLog(status: ServiceLogStatus): boolean {
  return status === "approved" || status === "submitted";
}
