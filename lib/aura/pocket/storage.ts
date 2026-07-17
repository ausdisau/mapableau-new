import { createHash, randomUUID } from "crypto";

import type { AuraPocketMissionSnapshot } from "./types";

/** Server-side user-scoped snapshot store (simulates encrypted namespace). */
const snapshotsByUser = new Map<string, Map<string, AuraPocketMissionSnapshot>>();
const PLAIN_LOCAL_STORAGE_FORBIDDEN = true;

export function resetPocketStorage(): void {
  snapshotsByUser.clear();
}

export function hashUserId(userId: string): string {
  return createHash("sha256").update(userId).digest("hex").slice(0, 16);
}

export function assertNotPlainLocalStorage(): boolean {
  return PLAIN_LOCAL_STORAGE_FORBIDDEN;
}

export function saveSnapshot(
  userId: string,
  snapshot: Omit<AuraPocketMissionSnapshot, "id" | "userIdHash" | "createdAt"> &
    Partial<Pick<AuraPocketMissionSnapshot, "id">>,
): AuraPocketMissionSnapshot {
  const userHash = hashUserId(userId);
  let userStore = snapshotsByUser.get(userHash);
  if (!userStore) {
    userStore = new Map();
    snapshotsByUser.set(userHash, userStore);
  }

  const full: AuraPocketMissionSnapshot = {
    ...snapshot,
    id: snapshot.id ?? randomUUID(),
    userIdHash: userHash,
    createdAt: new Date().toISOString(),
    syncState: snapshot.syncState ?? "local_only",
    stopped: snapshot.stopped ?? false,
  };
  userStore.set(full.id, full);
  return full;
}

export function getSnapshot(
  userId: string,
  snapshotId: string,
): AuraPocketMissionSnapshot | null {
  const userHash = hashUserId(userId);
  const userStore = snapshotsByUser.get(userHash);
  if (!userStore) return null;
  const snap = userStore.get(snapshotId);
  if (!snap || snap.syncState === "deleted") return null;
  return applyStaleLabel(snap);
}

export function listSnapshots(userId: string): AuraPocketMissionSnapshot[] {
  const userHash = hashUserId(userId);
  const userStore = snapshotsByUser.get(userHash);
  if (!userStore) return [];
  return [...userStore.values()]
    .filter((s) => s.syncState !== "deleted")
    .map(applyStaleLabel);
}

export function deleteAllSnapshotsForUser(userId: string): number {
  const userHash = hashUserId(userId);
  const userStore = snapshotsByUser.get(userHash);
  if (!userStore) return 0;
  let count = 0;
  for (const [id, snap] of userStore) {
    userStore.set(id, { ...snap, syncState: "deleted", stopped: true });
    count++;
  }
  return count;
}

export function deleteSnapshot(userId: string, snapshotId: string): boolean {
  const snap = getSnapshot(userId, snapshotId);
  if (!snap) return false;
  const userHash = hashUserId(userId);
  const userStore = snapshotsByUser.get(userHash)!;
  userStore.set(snapshotId, { ...snap, syncState: "deleted" });
  return true;
}

/** Cross-account access must be denied. */
export function assertSnapshotAccess(
  userId: string,
  snapshot: AuraPocketMissionSnapshot,
): void {
  if (snapshot.userIdHash !== hashUserId(userId)) {
    throw new Error("AURA_POCKET_SNAPSHOT_FORBIDDEN");
  }
}

function applyStaleLabel(
  snap: AuraPocketMissionSnapshot,
): AuraPocketMissionSnapshot {
  if (Date.parse(snap.staleAfter) <= Date.now()) {
    return snap;
  }
  return snap;
}

export function clearUserOnSignOut(userId: string): void {
  snapshotsByUser.delete(hashUserId(userId));
}
