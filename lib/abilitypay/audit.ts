import type { MapAbleUserRole } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";

export async function logAbilityPayEvent(params: {
  action: string;
  entityType: string;
  entityId?: string | null;
  actorUserId?: string | null;
  actorRole?: MapAbleUserRole | null;
  participantId?: string | null;
  organisationId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  await createAuditEvent({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole ?? null,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    participantId: params.participantId,
    organisationId: params.organisationId,
    metadata: params.metadata,
  });
}
