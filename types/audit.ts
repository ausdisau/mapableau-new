import type { AuditAction } from "./mapable";

export type { AuditAction };

export interface AuditLogEntryView {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorRole: string | null;
  createdAt: string;
  summary: string;
}
