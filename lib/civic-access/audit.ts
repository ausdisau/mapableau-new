import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { MapAbleUserRole } from "@prisma/client";

export async function emitCivicAudit(input: {
  actorUserId?: string | null;
  actorRole?: MapAbleUserRole | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  organisationId?: string | null;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await createAuditEvent({
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    organisationId: input.organisationId,
    metadata: {
      ...(input.metadata ?? {}),
      correlationId: input.correlationId,
      system: "mapable_civic",
    },
  });
}
