import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function createAuditLog(params: {
  actorUserId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  before?: Prisma.InputJsonValue | null;
  after?: Prisma.InputJsonValue | null;
}) {
  return prisma.auditLog.create({
    data: {
      actorUserId: params.actorUserId ?? null,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      before: params.before ?? undefined,
      after: params.after ?? undefined,
    },
  });
}
