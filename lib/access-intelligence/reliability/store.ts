/**
 * In-memory reliability operations store.
 * When ACCESS_INTELLIGENCE_USE_PRISMA is enabled, callers may dual-write
 * to EvidenceReliabilityFinding / ReverificationTask via prisma adapters.
 */

import type { ReliabilityFindingDraft } from "@/lib/access-intelligence/reliability";

export type StoredReliabilityScan = {
  id: string;
  accessPlaceId: string;
  healthScore: number;
  findings: ReliabilityFindingDraft[];
  expiredFeatureTypes: string[];
  scannedAt: string;
};

export type StoredReverificationTask = {
  id: string;
  accessPlaceId: string;
  featureType?: string;
  reason: string;
  status: "open" | "scheduled" | "in_progress" | "resolved" | "cancelled";
  dueAt: string;
  createdAt: string;
};

const scans: StoredReliabilityScan[] = [];
const tasks: StoredReverificationTask[] = [];

export function clearReliabilityStoreForTests(): void {
  scans.length = 0;
  tasks.length = 0;
}

export function persistReliabilityScan(
  scan: Omit<StoredReliabilityScan, "id" | "scannedAt"> & {
    scannedAt?: string;
  },
): StoredReliabilityScan {
  const row: StoredReliabilityScan = {
    id: `scan-${scans.length + 1}`,
    scannedAt: scan.scannedAt ?? new Date().toISOString(),
    accessPlaceId: scan.accessPlaceId,
    healthScore: scan.healthScore,
    findings: scan.findings,
    expiredFeatureTypes: scan.expiredFeatureTypes,
  };
  scans.unshift(row);
  return row;
}

export function listReliabilityScans(accessPlaceId?: string): StoredReliabilityScan[] {
  if (!accessPlaceId) return [...scans];
  return scans.filter((s) => s.accessPlaceId === accessPlaceId);
}

export function persistReverificationTasks(
  drafts: Array<{
    accessPlaceId: string;
    featureType?: string;
    reason: string;
    dueAt?: string;
  }>,
): StoredReverificationTask[] {
  const created: StoredReverificationTask[] = [];
  for (const draft of drafts) {
    const row: StoredReverificationTask = {
      id: `rvt-${tasks.length + 1}`,
      accessPlaceId: draft.accessPlaceId,
      featureType: draft.featureType,
      reason: draft.reason,
      status: "open",
      dueAt: draft.dueAt ?? new Date(Date.now() + 86_400_000).toISOString(),
      createdAt: new Date().toISOString(),
    };
    tasks.push(row);
    created.push(row);
  }
  return created;
}

export function listReverificationTasks(filter?: {
  accessPlaceId?: string;
  status?: StoredReverificationTask["status"];
}): StoredReverificationTask[] {
  return tasks.filter((t) => {
    if (filter?.accessPlaceId && t.accessPlaceId !== filter.accessPlaceId) {
      return false;
    }
    if (filter?.status && t.status !== filter.status) return false;
    return true;
  });
}

export function updateReverificationTaskStatus(
  id: string,
  status: StoredReverificationTask["status"],
): StoredReverificationTask | null {
  const task = tasks.find((t) => t.id === id);
  if (!task) return null;
  task.status = status;
  return task;
}
