import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function writeBillingAuditLog(
  params: {
    actorUserId?: string | null;
    entityType: string;
    entityId: string;
    action: string;
    before?: unknown;
    after?: unknown;
  },
  db: DbClient = prisma,
) {
  return db.billingAuditLog.create({
    data: {
      actorUserId: params.actorUserId ?? null,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      before: params.before ? (params.before as object) : undefined,
      after: params.after ? (params.after as object) : undefined,
    },
  });
}
