import type { MapAbleUserRole, Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@/types/mapable";

export async function recordAcademyAudit(input: {
  actorUserId?: string | null;
  actorRole?: MapAbleUserRole | null;
  action: string | AuditAction;
  entityType: string;
  entityId?: string | null;
  organisationId?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  await createAuditEvent({
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    organisationId: input.organisationId,
    metadata: input.metadata,
  });

  await prisma.academyAuditEvent.create({
    data: {
      actorUserId: input.actorUserId ?? undefined,
      action: String(input.action),
      entityType: input.entityType,
      entityId: input.entityId ?? undefined,
      organisationId: input.organisationId ?? undefined,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
