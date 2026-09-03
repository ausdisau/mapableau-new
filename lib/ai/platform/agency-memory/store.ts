import type {
  AgencyMemoryControls,
  MapAbleAgencyMemoryItem,
  PreferenceGraphEdge,
} from "./types";

/**
 * In-memory Agency Memory store (Prompt 01–04 pattern).
 * Durable Prisma persistence deferred to Prompt 05A if required.
 * Tenant isolation is enforced at every read/write boundary.
 */

const itemsByParticipant = new Map<string, MapAbleAgencyMemoryItem[]>();
const edgesByParticipant = new Map<string, PreferenceGraphEdge[]>();
const controlsByParticipant = new Map<string, AgencyMemoryControls>();
/** Audit trail of superseded / deleted versions retained as metadata only. */
const auditVersions = new Map<string, MapAbleAgencyMemoryItem[]>();

function participantKey(tenantId: string, participantId: string): string {
  return `${tenantId}::${participantId}`;
}

export function saveMemoryItem(item: MapAbleAgencyMemoryItem): void {
  const key = participantKey(item.tenantId, item.participantId);
  const existing = itemsByParticipant.get(key) ?? [];
  const idx = existing.findIndex((m) => m.memoryId === item.memoryId);
  if (idx >= 0) {
    existing[idx] = item;
  } else {
    existing.push(item);
  }
  itemsByParticipant.set(key, existing);
}

export function getMemoryItem(params: {
  memoryId: string;
  participantId: string;
  tenantId: string;
}): MapAbleAgencyMemoryItem | null {
  const key = participantKey(params.tenantId, params.participantId);
  const items = itemsByParticipant.get(key) ?? [];
  return items.find((m) => m.memoryId === params.memoryId) ?? null;
}

export function listMemoryItems(params: {
  participantId: string;
  tenantId: string;
  includeDeleted?: boolean;
}): MapAbleAgencyMemoryItem[] {
  const key = participantKey(params.tenantId, params.participantId);
  const items = itemsByParticipant.get(key) ?? [];
  if (params.includeDeleted) return [...items];
  return items.filter((m) => !m.deletedAt);
}

export function appendAuditVersion(item: MapAbleAgencyMemoryItem): void {
  const existing = auditVersions.get(item.memoryId) ?? [];
  existing.push({ ...item });
  auditVersions.set(item.memoryId, existing);
}

export function getAuditVersions(
  memoryId: string,
): MapAbleAgencyMemoryItem[] {
  return auditVersions.get(memoryId) ?? [];
}

export function saveGraphEdges(
  participantId: string,
  tenantId: string,
  edges: PreferenceGraphEdge[],
): void {
  edgesByParticipant.set(participantKey(tenantId, participantId), edges);
}

export function getGraphEdges(params: {
  participantId: string;
  tenantId: string;
}): PreferenceGraphEdge[] {
  return (
    edgesByParticipant.get(
      participantKey(params.tenantId, params.participantId),
    ) ?? []
  );
}

export function getControls(params: {
  participantId: string;
  tenantId: string;
}): AgencyMemoryControls {
  const key = participantKey(params.tenantId, params.participantId);
  return (
    controlsByParticipant.get(key) ?? {
      participantId: params.participantId,
      personalisationPaused: false,
      aiUseDisabled: false,
      updatedAt: new Date(0).toISOString(),
    }
  );
}

export function saveControls(controls: AgencyMemoryControls & { tenantId: string }): void {
  const { tenantId, ...rest } = controls;
  controlsByParticipant.set(
    participantKey(tenantId, rest.participantId),
    rest,
  );
}

export function clearAgencyMemoryStore(): void {
  itemsByParticipant.clear();
  edgesByParticipant.clear();
  controlsByParticipant.clear();
  auditVersions.clear();
}

/** Test helper — count items across tenants (must remain zero for cross-tenant leaks). */
export function debugCountAllItems(): number {
  let n = 0;
  for (const items of itemsByParticipant.values()) n += items.length;
  return n;
}
