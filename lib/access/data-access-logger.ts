import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/mapable";

import { actorRoleToPrisma } from "./role-policy";

export interface LogDataAccessInput {
  actorUserId: string;
  actorRole?: UserRole;
  participantId?: string;
  resourceType: string;
  resourceId?: string;
  action: string;
  consentStatus?: "active" | "missing" | "revoked" | "unknown";
  metadata?: Record<string, unknown>;
}

export async function logDataAccess(input: LogDataAccessInput): Promise<void> {
  await prisma.dataAccessLog.create({
    data: {
      actorUserId: input.actorUserId,
      actorRole: input.actorRole ? actorRoleToPrisma(input.actorRole) : null,
      participantId: input.participantId ?? null,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      action: input.action,
      consentStatus: input.consentStatus ?? "unknown",
      metadata: (input.metadata ?? undefined) as never,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    actorRole: input.actorRole ? actorRoleToPrisma(input.actorRole) : null,
    action: `data_access.${input.action}`,
    entityType: input.resourceType,
    entityId: input.resourceId,
    participantId: input.participantId,
    metadata: { consentStatus: input.consentStatus, ...input.metadata },
  });
}
