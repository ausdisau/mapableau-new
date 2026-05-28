import type { DispatchQueuePriority, DispatchQueueType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase6Config } from "@/lib/config/phase6";
import { prisma } from "@/lib/prisma";

export async function syncOperationalQueues(actorUserId: string) {
  if (!phase6Config.dispatchConsoleEnabled) return { skipped: true };

  const [careShifts, allocationReviews, transports, criticalIncidents] =
    await Promise.all([
    prisma.careShift.findMany({
      where: { status: { in: ["scheduled", "in_progress"] } },
      take: 20,
    }),
    prisma.careAllocationProposal.findMany({
      where: { status: "review_required" },
      include: {
        workerProfile: { select: { displayName: true } },
        allocationRun: { select: { careBookingId: true, organisationId: true } },
      },
      take: 20,
    }),
    prisma.transportBooking.findMany({
      where: { status: { in: ["confirmed", "driver_en_route", "in_transit"] } },
      take: 20,
    }),
    prisma.incidentReport.findMany({
      where: {
        severity: "critical",
        status: { notIn: ["closed", "resolved"] },
      },
      take: 10,
    }),
  ]);

  for (const s of careShifts) {
    await upsertQueue({
      queueType: "care_shift",
      title: `Care shift ${s.startAt.toLocaleDateString("en-AU")}`,
      entityType: "CareShift",
      entityId: s.id,
      organisationId: s.organisationId,
      priority: "normal",
      plainLanguageSummary: "Scheduled care support",
    });
  }

  for (const p of allocationReviews) {
    await upsertQueue({
      queueType: "care_allocation",
      title: `Allocate ${p.workerProfile.displayName}`,
      entityType: "CareAllocationProposal",
      entityId: p.id,
      organisationId: p.allocationRun.organisationId,
      priority: "high",
      plainLanguageSummary:
        "Care worker allocation proposal requires human approval",
    });
  }

  for (const t of transports) {
    await upsertQueue({
      queueType: "transport_booking",
      title: `Transport ${t.pickupAddress.slice(0, 40)}`,
      entityType: "TransportBooking",
      entityId: t.id,
      organisationId: t.operatorOrganisationId ?? undefined,
      priority: "normal",
      plainLanguageSummary: "Active transport trip",
    });
  }

  for (const i of criticalIncidents) {
    await upsertQueue({
      queueType: "incident",
      title: i.title,
      entityType: "IncidentReport",
      entityId: i.id,
      organisationId: i.organisationId ?? undefined,
      priority: "urgent",
      plainLanguageSummary: "Critical incident requires triage",
    });
  }

  await createAuditEvent({
    actorUserId,
    action: "dispatch.queues_synced",
    entityType: "DispatchQueue",
    entityId: "batch",
  });

  return prisma.dispatchQueue.findMany({
    where: { status: "open" },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: 50,
  });
}

async function upsertQueue(params: {
  queueType: DispatchQueueType;
  title: string;
  entityType: string;
  entityId: string;
  organisationId?: string;
  priority: DispatchQueuePriority;
  plainLanguageSummary: string;
}) {
  const existing = await prisma.dispatchQueue.findFirst({
    where: { entityType: params.entityType, entityId: params.entityId, status: "open" },
  });
  if (existing) return existing;
  return prisma.dispatchQueue.create({ data: { ...params, status: "open" } });
}

export async function recordDispatchAction(
  queueId: string,
  actorUserId: string,
  actionType: string,
  notes?: string
) {
  const action = await prisma.dispatchAction.create({
    data: { queueId, actorUserId, actionType, notes },
  });
  await createAuditEvent({
    actorUserId,
    action: "dispatch.action_recorded",
    entityType: "DispatchQueue",
    entityId: queueId,
  });
  return action;
}
