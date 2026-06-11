import type { MapAbleUserRole } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";

import type { CoordinateAuditAction } from "./types";

export async function logCoordinateAudit(params: {
  action: CoordinateAuditAction | string;
  actorUserId?: string | null;
  actorRole?: MapAbleUserRole | null;
  entityType: string;
  entityId?: string | null;
  participantId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  await createAuditEvent({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    participantId: params.participantId,
    metadata: params.metadata,
  });
}

export async function listCoordinateAuditEvents(params: {
  participantId?: string;
  limit?: number;
  cursor?: string;
}) {
  const { prisma } = await import("@/lib/prisma");
  const take = params.limit ?? 50;

  const events = await prisma.auditEvent.findMany({
    where: {
      ...(params.participantId ? { participantId: params.participantId } : {}),
      action: { startsWith: "coordinate." },
      ...(params.cursor ? { id: { lt: params.cursor } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      actorUser: { select: { name: true } },
    },
  });

  return events;
}
