import type { MapAbleContextRecord, MapAbleDomainEvent } from "./types";

/**
 * In-memory Context Fabric store (Prompt 04).
 * Not multi-instance durable — Prompt 04A required for Prisma persistence.
 */
const recordsById = new Map<string, MapAbleContextRecord>();
const recordsByTenant = new Map<string, Set<string>>();
const eventsById = new Map<string, MapAbleDomainEvent>();
const idempotencyKeys = new Set<string>();
const revokedConsentKeys = new Set<string>();

function tenantKey(tenantId: string, participantId: string, scope: string): string {
  return `${tenantId}:${participantId}:${scope}`;
}

export function saveContextRecord(
  record: MapAbleContextRecord,
): { saved: boolean } {
  recordsById.set(record.contextId, record);
  const set = recordsByTenant.get(record.tenantId) ?? new Set();
  set.add(record.contextId);
  recordsByTenant.set(record.tenantId, set);
  return { saved: true };
}

export function getContextRecord(contextId: string): MapAbleContextRecord | null {
  return recordsById.get(contextId) ?? null;
}

export function listContextRecordsForTenant(
  tenantId: string,
): MapAbleContextRecord[] {
  const ids = recordsByTenant.get(tenantId);
  if (!ids) return [];
  return [...ids]
    .map((id) => recordsById.get(id))
    .filter((r): r is MapAbleContextRecord => Boolean(r));
}

export function updateContextRecord(
  record: MapAbleContextRecord,
): void {
  recordsById.set(record.contextId, record);
}

export function saveDomainEvent(
  event: MapAbleDomainEvent,
): { saved: boolean; duplicate: boolean } {
  if (event.idempotencyKey) {
    const key = `${event.tenantId}:${event.idempotencyKey}`;
    if (idempotencyKeys.has(key)) {
      return { saved: false, duplicate: true };
    }
    idempotencyKeys.add(key);
  }
  if (eventsById.has(event.eventId)) {
    return { saved: false, duplicate: true };
  }
  eventsById.set(event.eventId, event);
  return { saved: true, duplicate: false };
}

export function getDomainEvent(eventId: string): MapAbleDomainEvent | null {
  return eventsById.get(eventId) ?? null;
}

export function listDomainEvents(): MapAbleDomainEvent[] {
  return [...eventsById.values()];
}

export function markConsentRevoked(
  tenantId: string,
  participantId: string,
  scope: string,
): void {
  revokedConsentKeys.add(tenantKey(tenantId, participantId, scope));
}

export function isConsentRevoked(
  tenantId: string,
  participantId: string,
  scope: string,
): boolean {
  return revokedConsentKeys.has(tenantKey(tenantId, participantId, scope));
}

export function listRevokedConsentKeys(): string[] {
  return [...revokedConsentKeys];
}

export function clearContextFabricStore(): void {
  recordsById.clear();
  recordsByTenant.clear();
  eventsById.clear();
  idempotencyKeys.clear();
  revokedConsentKeys.clear();
}
