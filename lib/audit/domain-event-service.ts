import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  emitDomainEventSchema,
  type EmitDomainEventInput,
} from "@/lib/validation/reporting-audit";

export async function emitDomainEvent(input: EmitDomainEventInput): Promise<string> {
  const parsed = emitDomainEventSchema.parse(input);

  const event = await prisma.domainEvent.create({
    data: {
      domain: parsed.domain,
      eventType: parsed.eventType,
      entityType: parsed.entityType,
      entityId: parsed.entityId,
      participantId: parsed.participantId ?? null,
      organisationId: parsed.organisationId ?? null,
      actorUserId: parsed.actorUserId ?? null,
      summary: parsed.summary,
      metadata: (parsed.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      correlationId: parsed.correlationId ?? null,
    },
  });

  return event.id;
}

export async function getEntityTimeline(entityType: string, entityId: string, limit = 50) {
  return prisma.domainEvent.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      actorUser: { select: { name: true, email: true } },
    },
  });
}

export async function getParticipantActivityTimeline(participantUserId: string, limit = 50) {
  return prisma.domainEvent.findMany({
    where: { participantId: participantUserId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      actorUser: { select: { name: true, email: true } },
    },
  });
}

export async function getOrganisationDomainEvents(organisationId: string, limit = 50) {
  return prisma.domainEvent.findMany({
    where: { organisationId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
