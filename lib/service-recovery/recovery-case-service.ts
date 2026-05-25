import type { ServiceRecoveryTrigger } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { requireModuleEnabled } from "@/lib/feature-flags/require-module";
import { recordParticipantTimelineEvent } from "@/lib/timeline/timeline-service";

import { isHighRiskRecovery } from "./recovery-policy";

export async function openRecoveryCase(params: {
  participantId: string;
  trigger: ServiceRecoveryTrigger;
  summary: string;
  bookingId?: string;
  organisationId?: string;
  createdById?: string;
}) {
  await requireModuleEnabled("service_recovery_enabled");

  const highRisk = isHighRiskRecovery(params.trigger);

  const existing = params.bookingId
    ? await prisma.serviceRecoveryCase.findFirst({
        where: {
          bookingId: params.bookingId,
          status: { notIn: ["resolved", "cancelled"] },
        },
      })
    : null;
  if (existing) return existing;

  const caseRecord = await prisma.serviceRecoveryCase.create({
    data: {
      participantId: params.participantId,
      trigger: params.trigger,
      summary: params.summary,
      bookingId: params.bookingId,
      organisationId: params.organisationId,
      highRisk,
      createdById: params.createdById,
      status: "open",
    },
  });

  await prisma.serviceRecoveryEvent.create({
    data: {
      caseId: caseRecord.id,
      eventType: "case_opened",
      actorUserId: params.createdById,
      metadata: { trigger: params.trigger },
    },
  });

  await createAuditEvent({
    actorUserId: params.createdById,
    action: "service_recovery.case_opened",
    entityType: "ServiceRecoveryCase",
    entityId: caseRecord.id,
    participantId: params.participantId,
    metadata: { trigger: params.trigger, highRisk },
  });

  await recordParticipantTimelineEvent({
    participantId: params.participantId,
    eventType: "service_recovery_case_opened",
    title: "Service recovery started",
    summary: params.summary,
    sourceType: "ServiceRecoveryCase",
    sourceId: caseRecord.id,
  });

  return caseRecord;
}

export async function listRecoveryCases(filters: {
  participantId?: string;
  organisationId?: string;
  status?: string;
}) {
  await requireModuleEnabled("service_recovery_enabled");
  return prisma.serviceRecoveryCase.findMany({
    where: {
      ...(filters.participantId ? { participantId: filters.participantId } : {}),
      ...(filters.organisationId
        ? { organisationId: filters.organisationId }
        : {}),
      ...(filters.status ? { status: filters.status as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { backupOptions: true },
    take: 100,
  });
}

export async function getRecoveryCase(id: string) {
  return prisma.serviceRecoveryCase.findUnique({
    where: { id },
    include: {
      backupOptions: true,
      events: { orderBy: { createdAt: "asc" } },
      escalations: true,
    },
  });
}

export async function resolveRecoveryCase(
  id: string,
  actorUserId: string,
  resolutionSummary?: string
) {
  const updated = await prisma.serviceRecoveryCase.update({
    where: { id },
    data: {
      status: "resolved",
      resolvedAt: new Date(),
    },
  });

  await prisma.serviceRecoveryAction.create({
    data: {
      caseId: id,
      actionType: "resolved",
      actorUserId,
      notes: resolutionSummary,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "service_recovery.resolved",
    entityType: "ServiceRecoveryCase",
    entityId: id,
    participantId: updated.participantId,
  });

  return updated;
}
