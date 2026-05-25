import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function logClinicalAudit(params: {
  entityType: string;
  entityId: string;
  action: string;
  actorUserId?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.clinicalAuditLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      actorUserId: params.actorUserId,
      metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}
