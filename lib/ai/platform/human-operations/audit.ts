/**
 * In-memory human operations audit trail (Prompt 08).
 * Durable audit persistence would require Prompt 08A migration — not in this change.
 */

export type HumanOpsAuditEvent = {
  auditId: string;
  reviewId: string;
  actorId: string;
  action: string;
  at: string;
  detail: Record<string, string | number | boolean | null>;
  tenantId: string;
};

const auditLog: HumanOpsAuditEvent[] = [];

export function appendHumanOpsAudit(
  event: Omit<HumanOpsAuditEvent, "auditId" | "at"> & {
    auditId?: string;
    at?: string;
  },
): HumanOpsAuditEvent {
  const recorded: HumanOpsAuditEvent = {
    auditId: event.auditId ?? `hoa-${auditLog.length + 1}-${Date.now()}`,
    reviewId: event.reviewId,
    actorId: event.actorId,
    action: event.action,
    at: event.at ?? new Date().toISOString(),
    detail: event.detail,
    tenantId: event.tenantId,
  };
  auditLog.push(recorded);
  return recorded;
}

export function listHumanOpsAuditForReview(
  reviewId: string,
): HumanOpsAuditEvent[] {
  return auditLog.filter((e) => e.reviewId === reviewId);
}

export function listHumanOpsAuditForTenant(
  tenantId: string,
): HumanOpsAuditEvent[] {
  return auditLog.filter((e) => e.tenantId === tenantId);
}

export function clearHumanOpsAudit(): void {
  auditLog.length = 0;
}
