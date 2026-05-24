import type { OfflineConflictType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function createOfflineConflict(params: {
  userId: string;
  conflictType: OfflineConflictType;
  localPayload?: unknown;
  serverState?: unknown;
}) {
  return prisma.offlineConflictRecord.create({
    data: {
      userId: params.userId,
      conflictType: params.conflictType,
      localPayload: params.localPayload as object | undefined,
      serverState: params.serverState as object | undefined,
      status: "open",
    },
  });
}

export async function resolveConflict(
  conflictId: string,
  resolverId: string,
  resolution: "keep_server" | "keep_local" | "manual_merge"
) {
  const conflict = await prisma.offlineConflictRecord.update({
    where: { id: conflictId },
    data: {
      status: "resolved",
      resolvedBy: resolverId,
      resolvedAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId: resolverId,
    action: "offline.conflict_resolved",
    entityType: "OfflineConflictRecord",
    entityId: conflictId,
    metadata: { resolution },
  });

  return conflict;
}

export async function listOpenConflicts(userId: string) {
  return prisma.offlineConflictRecord.findMany({
    where: { userId, status: "open" },
    orderBy: { createdAt: "desc" },
  });
}
