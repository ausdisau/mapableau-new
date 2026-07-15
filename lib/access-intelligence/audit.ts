import type { AccessAuditEvent } from "./schemas";

const auditLog: AccessAuditEvent[] = [];

export function recordAuditEvent(
  event: Omit<AccessAuditEvent, "id" | "timestamp" | "fieldsShared"> & {
    id?: string;
    timestamp?: string;
    fieldsShared?: string[];
  },
): AccessAuditEvent {
  const full: AccessAuditEvent = {
    id: event.id ?? `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action: event.action,
    actorUserId: event.actorUserId,
    purpose: event.purpose,
    fieldsShared: event.fieldsShared ?? [],
    recipient: event.recipient,
    timestamp: event.timestamp ?? new Date().toISOString(),
    outcome: event.outcome,
    metadata: event.metadata,
  };
  auditLog.push(full);
  return full;
}

export function listAuditEvents(actorUserId?: string): AccessAuditEvent[] {
  if (!actorUserId) return [...auditLog];
  return auditLog.filter((e) => e.actorUserId === actorUserId);
}

export function clearAuditEventsForTests(): void {
  auditLog.length = 0;
}
