import { randomUUID } from "crypto";

import { getMission, requireMission } from "@/lib/aura/mission/store";
import {
  deleteSnapshot,
  getSnapshot,
  hashUserId,
  listSnapshots,
  saveSnapshot,
} from "@/lib/aura/pocket/storage";
import type {
  AuraOfflineSyncOperation,
  AuraPendingStopReceipt,
} from "@/lib/aura/pocket/types";
import { executeStopAura } from "@/lib/aura/stop";
import { appendWitness } from "@/lib/aura/witness";

const pendingOps = new Map<string, AuraOfflineSyncOperation>();
const pendingStops = new Map<string, AuraPendingStopReceipt>();

export function resetPocketSyncStore(): void {
  pendingOps.clear();
  pendingStops.clear();
}

export function queueSyncOperation(input: {
  userId: string;
  type: AuraOfflineSyncOperation["type"];
  payloadRef: string;
  idempotencyKey?: string;
}): AuraOfflineSyncOperation {
  const op: AuraOfflineSyncOperation = {
    id: randomUUID(),
    userId: input.userId,
    type: input.type,
    payloadRef: input.payloadRef,
    idempotencyKey: input.idempotencyKey ?? randomUUID(),
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  pendingOps.set(op.id, op);
  return op;
}

export function listPendingSync(userId: string): AuraOfflineSyncOperation[] {
  return [...pendingOps.values()].filter(
    (o) => o.userId === userId && o.status === "pending",
  );
}

function syncPriority(t: AuraOfflineSyncOperation["type"]): number {
  // stop_receipt first, then deletion — never blocked by execution rejection.
  if (t === "stop_receipt") return 0;
  if (t === "deletion") return 1;
  return 2;
}

/**
 * Process sync queue — prioritises stop_receipt, then deletion.
 * Deletion / stop are not blocked by rejectOfflineExecutionApproval.
 */
export function processSyncQueue(input: {
  userId: string;
  rejectOfflineExecutionApproval?: boolean;
}): {
  synced: string[];
  conflicts: string[];
  rejected: string[];
} {
  const synced: string[] = [];
  const conflicts: string[] = [];
  const rejected: string[] = [];

  const ops = listPendingSync(input.userId).sort(
    (a, b) => syncPriority(a.type) - syncPriority(b.type),
  );

  for (const op of ops) {
    if (op.type === "stop_receipt") {
      const receipt = pendingStops.get(op.payloadRef);
      if (receipt) {
        // Offline Pocket may stop a mission that never reached the server store.
        if (!getMission(receipt.missionId)) {
          pendingOps.set(op.id, { ...op, status: "synced" });
          pendingStops.set(receipt.id, {
            ...receipt,
            syncedAt: new Date().toISOString(),
          });
          synced.push(op.id);
          continue;
        }
        try {
          executeStopAura({
            missionId: receipt.missionId,
            userId: receipt.userId,
          });
          pendingOps.set(op.id, { ...op, status: "synced" });
          pendingStops.set(receipt.id, {
            ...receipt,
            syncedAt: new Date().toISOString(),
          });
          synced.push(op.id);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "SYNC_ERROR";
          if (msg === "AURA_MISSION_STOPPED") {
            pendingOps.set(op.id, { ...op, status: "synced" });
            synced.push(op.id);
          } else {
            pendingOps.set(op.id, { ...op, status: "conflict" });
            conflicts.push(op.id);
          }
        }
      } else {
        pendingOps.set(op.id, { ...op, status: "conflict" });
        conflicts.push(op.id);
      }
      continue;
    }

    if (op.type === "deletion") {
      // Deletion must proceed even when offline execution approvals are rejected.
      const ok = deleteSnapshot(input.userId, op.payloadRef);
      pendingOps.set(op.id, { ...op, status: ok ? "synced" : "conflict" });
      if (ok) synced.push(op.id);
      else conflicts.push(op.id);
      continue;
    }

    if (input.rejectOfflineExecutionApproval) {
      if (op.type === "execution_approval") {
        rejected.push(op.id);
        pendingOps.set(op.id, { ...op, status: "rejected" });
        continue;
      }
      // Other non-critical ops can still sync when not execution approvals.
    }

    pendingOps.set(op.id, { ...op, status: "synced" });
    synced.push(op.id);
  }

  return { synced, conflicts, rejected };
}

export function queueOfflineStop(input: {
  userId: string;
  missionId: string;
  snapshotId?: string;
}): AuraPendingStopReceipt {
  const mission = requireMission(input.missionId);
  if (mission.participantId !== input.userId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }

  const idempotencyKey = `stop-${input.missionId}-${hashUserId(input.userId)}`;
  const existing = [...pendingStops.values()].find(
    (r) => r.idempotencyKey === idempotencyKey,
  );
  if (existing) return existing;

  const receipt: AuraPendingStopReceipt = {
    id: randomUUID(),
    missionId: input.missionId,
    userId: input.userId,
    requestedAt: new Date().toISOString(),
    idempotencyKey,
  };
  pendingStops.set(receipt.id, receipt);

  if (input.snapshotId) {
    const snap = getSnapshot(input.userId, input.snapshotId);
    if (snap) {
      saveSnapshot(input.userId, {
        ...snap,
        stopped: true,
        syncState: "local_changes",
      });
    }
  }

  queueSyncOperation({
    userId: input.userId,
    type: "stop_receipt",
    payloadRef: receipt.id,
    idempotencyKey,
  });

  appendWitness({
    missionId: input.missionId,
    type: "pocket.offline_stop_queued",
    summary: "Offline Stop AURA queued for sync",
    correlationId: mission.correlationId,
    payload: { receiptId: receipt.id },
  });

  return receipt;
}

export function rejectOfflineExecutionApproval(): never {
  throw new Error("AURA_OFFLINE_EXECUTION_APPROVAL_REJECTED");
}

export function deleteOfflineData(input: {
  userId: string;
  snapshotId?: string;
}): { deleted: number } {
  if (input.snapshotId) {
    queueSyncOperation({
      userId: input.userId,
      type: "deletion",
      payloadRef: input.snapshotId,
    });
    const ok = deleteSnapshot(input.userId, input.snapshotId);
    return { deleted: ok ? 1 : 0 };
  }
  const snaps = listSnapshots(input.userId);
  let deleted = 0;
  for (const s of snaps) {
    queueSyncOperation({
      userId: input.userId,
      type: "deletion",
      payloadRef: s.id,
    });
    if (deleteSnapshot(input.userId, s.id)) deleted++;
  }
  return { deleted };
}
