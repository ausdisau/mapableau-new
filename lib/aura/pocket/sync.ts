import { randomUUID } from "crypto";

import { executeStopAura } from "../stop";
import { requireMission } from "../mission/store";
import { appendWitness } from "../witness";
import {
  deleteSnapshot,
  getSnapshot,
  hashUserId,
  listSnapshots,
  saveSnapshot,
} from "./storage";
import type { AuraOfflineSyncOperation, AuraPendingStopReceipt } from "./types";

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

/**
 * Process sync queue — Stop and deletion take precedence.
 * Offline execution approvals are rejected.
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

  const ops = listPendingSync(input.userId).sort((a, b) => {
    const priority = (t: AuraOfflineSyncOperation["type"]) => {
      if (t === "stop_receipt" || t === "deletion") return 0;
      return 1;
    };
    return priority(a.type) - priority(b.type);
  });

  for (const op of ops) {
    if (op.type === "stop_receipt") {
      const receipt = pendingStops.get(op.payloadRef);
      if (receipt) {
        try {
          executeStopAura({
            missionId: receipt.missionId,
            userId: receipt.userId,
          });
          pendingOps.set(op.id, { ...op, status: "synced" });
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
      }
      continue;
    }

    if (input.rejectOfflineExecutionApproval) {
      rejected.push(op.id);
      pendingOps.set(op.id, { ...op, status: "rejected" });
      continue;
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
      saveSnapshot(input.userId, { ...snap, stopped: true, syncState: "local_changes" });
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

export function markSnapshotStoppedLocally(input: {
  userId: string;
  snapshotId: string;
}): void {
  const snap = getSnapshot(input.userId, input.snapshotId);
  if (!snap) throw new Error("AURA_POCKET_SNAPSHOT_NOT_FOUND");
  saveSnapshot(input.userId, {
    ...snap,
    stopped: true,
    syncState: "local_changes",
  });
}

export function resolveStopConflictInFavourOfParticipant(input: {
  userId: string;
  missionId: string;
}): void {
  const mission = requireMission(input.missionId);
  if (mission.participantId !== input.userId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }
  const snaps = listSnapshots(input.userId).filter(
    (s) => s.missionId === input.missionId,
  );
  for (const snap of snaps) {
    if (snap.stopped) {
      executeStopAura({ missionId: input.missionId, userId: input.userId });
      return;
    }
  }
}

export function rejectOfflineExecutionApproval(): never {
  throw new Error("AURA_OFFLINE_EXECUTION_APPROVAL_REJECTED");
}

export function deleteOfflineData(input: {
  userId: string;
  snapshotId?: string;
}): { deleted: number } {
  if (input.snapshotId) {
    const ok = deleteSnapshot(input.userId, input.snapshotId);
    return { deleted: ok ? 1 : 0 };
  }
  const snaps = listSnapshots(input.userId);
  let deleted = 0;
  for (const s of snaps) {
    if (deleteSnapshot(input.userId, s.id)) deleted++;
  }
  return { deleted };
}
