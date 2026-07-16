import { createAuditEvent } from "@/lib/audit/audit-event-service";

import type { AccessAuditEvent } from "./schemas";

const auditLog: AccessAuditEvent[] = [];

function newCorrelationId(): string {
  return `ai-corr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Records an Access Intelligence audit event in-memory (tests/demo) and,
 * for consequential outcomes, mirrors to canonical AuditEvent with correlationId.
 */
export function recordAuditEvent(
  event: Omit<AccessAuditEvent, "id" | "timestamp" | "fieldsShared"> & {
    id?: string;
    timestamp?: string;
    fieldsShared?: string[];
    correlationId?: string;
    entityType?: string;
    entityId?: string;
    persistCanonical?: boolean;
  },
): AccessAuditEvent {
  const correlationId = event.correlationId ?? newCorrelationId();
  const full: AccessAuditEvent = {
    id: event.id ?? `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action: event.action,
    actorUserId: event.actorUserId,
    purpose: event.purpose,
    fieldsShared: event.fieldsShared ?? [],
    recipient: event.recipient,
    timestamp: event.timestamp ?? new Date().toISOString(),
    outcome: event.outcome,
    metadata: {
      ...(event.metadata ?? {}),
      correlationId,
    },
  };
  auditLog.push(full);

  const shouldPersist =
    event.persistCanonical !== false &&
    event.outcome !== "cancelled" &&
    !event.actorUserId.startsWith("demo-");

  if (shouldPersist) {
    void createAuditEvent({
      actorUserId: event.actorUserId,
      action: `access_intelligence.${event.action}`,
      entityType: event.entityType ?? "AccessIntelligence",
      entityId: event.entityId ?? full.id,
      participantId: event.actorUserId,
      metadata: {
        correlationId,
        purpose: event.purpose,
        fieldsShared: full.fieldsShared,
        recipient: event.recipient,
        outcome: event.outcome,
        ...(event.metadata ?? {}),
      },
    }).catch(() => {
      /* non-blocking: request may be outside Next headers / DB unavailable in unit tests */
    });
  }

  return full;
}

export function listAuditEvents(actorUserId?: string): AccessAuditEvent[] {
  if (!actorUserId) return [...auditLog];
  return auditLog.filter((e) => e.actorUserId === actorUserId);
}

export function clearAuditEventsForTests(): void {
  auditLog.length = 0;
}

export function getCorrelationIdFromEvent(
  event: AccessAuditEvent,
): string | undefined {
  const meta = event.metadata;
  if (meta && typeof meta === "object" && "correlationId" in meta) {
    const value = (meta as Record<string, unknown>).correlationId;
    return typeof value === "string" ? value : undefined;
  }
  return undefined;
}
