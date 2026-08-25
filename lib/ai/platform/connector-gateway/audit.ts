import { randomUUID } from "node:crypto";

import type {
  ConnectorAuditEvent,
  ConnectorPolicyReasonCode,
  MapAbleConnectorKey,
} from "./types";

const auditLog: ConnectorAuditEvent[] = [];

export function appendConnectorAudit(
  event: Omit<ConnectorAuditEvent, "auditId" | "at"> & {
    auditId?: string;
    at?: string;
  },
): ConnectorAuditEvent {
  const full: ConnectorAuditEvent = {
    auditId: event.auditId ?? randomUUID(),
    at: event.at ?? new Date().toISOString(),
    connectorKey: event.connectorKey,
    operation: event.operation,
    direction: event.direction,
    tenantId: event.tenantId,
    actorId: event.actorId,
    actorRole: event.actorRole,
    purpose: event.purpose,
    proposalId: event.proposalId,
    approvalId: event.approvalId,
    payloadHash: event.payloadHash,
    outcome: event.outcome,
    reasonCode: event.reasonCode,
  };
  auditLog.push(full);
  return full;
}

export function listConnectorAuditEvents(filter?: {
  connectorKey?: MapAbleConnectorKey;
  tenantId?: string;
  direction?: "read" | "write";
}): ConnectorAuditEvent[] {
  return auditLog.filter((e) => {
    if (filter?.connectorKey && e.connectorKey !== filter.connectorKey) {
      return false;
    }
    if (filter?.tenantId && e.tenantId !== filter.tenantId) return false;
    if (filter?.direction && e.direction !== filter.direction) return false;
    return true;
  });
}

export function clearConnectorAudit(): void {
  auditLog.length = 0;
}

export function findWriteAuditForProposal(
  proposalId: string,
): ConnectorAuditEvent | undefined {
  return auditLog.find(
    (e) => e.direction === "write" && e.proposalId === proposalId,
  );
}

export type IdempotencyEntry = {
  key: string;
  tenantId: string;
  connectorKey: MapAbleConnectorKey;
  resultRef: string;
  completedAt: string;
  reasonCode?: ConnectorPolicyReasonCode;
};

const idempotencyStore = new Map<string, IdempotencyEntry>();

function tenantScopedKey(tenantId: string, key: string): string {
  return `${tenantId}::${key}`;
}

export function claimConnectorIdempotency(input: {
  tenantId: string;
  key: string;
  connectorKey: MapAbleConnectorKey;
}): { claimed: true } | { claimed: false; existing: IdempotencyEntry } {
  const scoped = tenantScopedKey(input.tenantId, input.key);
  const existing = idempotencyStore.get(scoped);
  if (existing) {
    return { claimed: false, existing };
  }
  idempotencyStore.set(scoped, {
    key: input.key,
    tenantId: input.tenantId,
    connectorKey: input.connectorKey,
    resultRef: "",
    completedAt: "",
  });
  return { claimed: true };
}

export function completeConnectorIdempotency(input: {
  tenantId: string;
  key: string;
  resultRef: string;
}): void {
  const scoped = tenantScopedKey(input.tenantId, input.key);
  const entry = idempotencyStore.get(scoped);
  if (!entry) return;
  entry.resultRef = input.resultRef;
  entry.completedAt = new Date().toISOString();
}

export function getConnectorIdempotency(input: {
  tenantId: string;
  key: string;
}): IdempotencyEntry | undefined {
  return idempotencyStore.get(tenantScopedKey(input.tenantId, input.key));
}

export function clearConnectorIdempotency(): void {
  idempotencyStore.clear();
}
