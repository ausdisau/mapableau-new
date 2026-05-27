import type { MapAbleUserRole } from "@prisma/client";

import {
  createAuditEvent,
  logAdminSensitiveAccess,
  logAuditEvent,
  type CreateAuditEventInput,
} from "@/lib/audit/audit-service";

export type { CreateAuditEventInput };

export { createAuditEvent, logAdminSensitiveAccess, logAuditEvent };

/** Legacy alias */
export async function logAdminSensitiveAccessLegacy(params: {
  actorUserId: string;
  actorRole: MapAbleUserRole;
  entityType: string;
  entityId: string;
  participantId?: string;
}): Promise<void> {
  await logAdminSensitiveAccess(params);
}
