export {
  createAuditEvent,
  type CreateAuditEventInput,
} from "./audit-event-service";

import { prisma } from "@/lib/prisma";

import type { AuditLogEntryView } from "@/types/audit";

export async function listAuditLogsForAdmin(options?: {
  action?: string;
  query?: string;
  limit?: number;
}): Promise<AuditLogEntryView[]> {
  const events = await prisma.auditEvent.findMany({
    where: {
      ...(options?.action ? { action: options.action } : {}),
      ...(options?.query
        ? {
            OR: [
              { entityType: { contains: options.query, mode: "insensitive" } },
              { entityId: { contains: options.query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50,
  });

  return events.map((e) => ({
    id: e.id,
    action: e.action,
    entityType: e.entityType,
    entityId: e.entityId,
    actorRole: e.actorRole,
    createdAt: e.createdAt.toISOString(),
    summary: `${e.action} on ${e.entityType}${e.entityId ? ` (${e.entityId.slice(0, 8)}…)` : ""}`,
  }));
}
