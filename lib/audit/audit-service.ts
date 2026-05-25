import type { MapAbleUserRole } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { logDataAccess } from "@/lib/access/data-access-logger";
import type { PlatformConsentScope } from "@/types/consent";
import type { DataAccessAction } from "@/types/audit";

export interface LogAuditEventInput {
  actorUserId?: string | null;
  actorRole?: MapAbleUserRole | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  participantId?: string | null;
  organisationId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function logAuditEvent(input: LogAuditEventInput): Promise<void> {
  await createAuditEvent(input);
}

export async function logSensitiveDataAccess(params: {
  actorUserId: string;
  actorRole?: MapAbleUserRole | null;
  resourceType: string;
  resourceId?: string | null;
  participantId?: string | null;
  organisationId?: string | null;
  action?: DataAccessAction;
  consentScope?: PlatformConsentScope | null;
}): Promise<void> {
  await logDataAccess({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    participantId: params.participantId,
    organisationId: params.organisationId,
    action: params.action ?? "read",
    consentScope: params.consentScope,
  });
}

export { logDataAccess };
