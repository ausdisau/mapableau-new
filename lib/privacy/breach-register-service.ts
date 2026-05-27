import type { MapAbleUserRole, PrivacyBreachStatus } from "@prisma/client";

import { logAuditEvent } from "@/lib/audit/audit-service";
import { emitDomainEvent } from "@/lib/audit/domain-event-service";
import { prisma } from "@/lib/prisma";
import {
  createBreachSchema,
  updateBreachSchema,
} from "@/lib/validation/reporting-audit";

export async function listPrivacyBreaches(limit = 50) {
  return prisma.privacyBreachRecord.findMany({
    orderBy: { discoveredAt: "desc" },
    take: limit,
    include: {
      createdBy: { select: { name: true, email: true } },
      _count: { select: { affectedPeople: true, events: true } },
    },
  });
}

export async function getPrivacyBreach(id: string) {
  return prisma.privacyBreachRecord.findUnique({
    where: { id },
    include: {
      events: { orderBy: { createdAt: "asc" } },
      affectedPeople: true,
      createdBy: { select: { name: true, email: true } },
    },
  });
}

export async function createPrivacyBreach(
  input: unknown,
  actorUserId: string,
  actorRole: MapAbleUserRole
) {
  const parsed = createBreachSchema.parse(input);

  const breach = await prisma.privacyBreachRecord.create({
    data: {
      title: parsed.title,
      description: parsed.description,
      discoveredAt: new Date(parsed.discoveredAt),
      notifiable: parsed.notifiable ?? false,
      createdById: actorUserId,
    },
  });

  await prisma.privacyBreachEvent.create({
    data: {
      breachId: breach.id,
      eventType: "breach.created",
      summary: `Breach record created: ${parsed.title}`,
      actorUserId,
    },
  });

  await logAuditEvent({
    actorUserId,
    actorRole,
    action: "privacy.breach.created",
    domain: "privacy",
    entityType: "PrivacyBreachRecord",
    entityId: breach.id,
    riskLevel: "critical",
    outcome: "success",
  });

  await emitDomainEvent({
    domain: "privacy",
    eventType: "breach.created",
    entityType: "PrivacyBreachRecord",
    entityId: breach.id,
    actorUserId,
    summary: `Privacy breach record created: ${parsed.title}`,
  });

  return breach;
}

export async function updatePrivacyBreach(
  id: string,
  input: unknown,
  actorUserId: string,
  actorRole: MapAbleUserRole
) {
  const parsed = updateBreachSchema.parse(input);

  const breach = await prisma.privacyBreachRecord.update({
    where: { id },
    data: {
      ...(parsed.title !== undefined ? { title: parsed.title } : {}),
      ...(parsed.description !== undefined ? { description: parsed.description } : {}),
      ...(parsed.status !== undefined
        ? { status: parsed.status as PrivacyBreachStatus }
        : {}),
      ...(parsed.reportedAt !== undefined
        ? { reportedAt: parsed.reportedAt ? new Date(parsed.reportedAt) : null }
        : {}),
      ...(parsed.notifiable !== undefined ? { notifiable: parsed.notifiable } : {}),
      ...(parsed.remediationNotes !== undefined
        ? { remediationNotes: parsed.remediationNotes }
        : {}),
    },
  });

  await prisma.privacyBreachEvent.create({
    data: {
      breachId: breach.id,
      eventType: "breach.updated",
      summary: `Breach record updated`,
      actorUserId,
      metadata: parsed,
    },
  });

  await logAuditEvent({
    actorUserId,
    actorRole,
    action: "privacy.breach.updated",
    domain: "privacy",
    entityType: "PrivacyBreachRecord",
    entityId: breach.id,
    riskLevel: "high",
    outcome: "success",
    metadata: parsed,
  });

  return breach;
}

export async function addAffectedPerson(input: {
  breachId: string;
  participantId?: string;
  roleLabel?: string;
  impactSummary?: string;
  actorUserId: string;
  actorRole: MapAbleUserRole;
}) {
  const record = await prisma.affectedPeopleRecord.create({
    data: {
      breachId: input.breachId,
      participantId: input.participantId ?? null,
      roleLabel: input.roleLabel ?? null,
      impactSummary: input.impactSummary ?? null,
    },
  });

  await logAuditEvent({
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    action: "privacy.breach.affected_person_added",
    domain: "privacy",
    entityType: "AffectedPeopleRecord",
    entityId: record.id,
    participantId: input.participantId,
    riskLevel: "high",
    outcome: "success",
  });

  return record;
}
