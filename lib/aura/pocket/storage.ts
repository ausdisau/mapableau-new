import { createHash, randomUUID } from "crypto";

import type { AuraPocketMissionSnapshot } from "@/lib/aura/pocket/types";

/** Server-side user-scoped snapshot store indexed by hashed user id. */
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

/**
 * Upsert a snapshot under the hashed user namespace.
 * Updates preserve the original `createdAt` (Wave 6 resilience mandate).
 */
export function saveSnapshot(
  userId: string,
  snapshot: Omit<AuraPocketMissionSnapshot, "id" | "userIdHash" | "createdAt"> &
    Partial<Pick<AuraPocketMissionSnapshot, "id" | "createdAt">>,
): AuraPocketMissionSnapshot {
  const userHash = hashUserId(userId);
  let userStore = snapshotsByUser.get(userHash);
  if (!userStore) {
    userStore = new Map();
    snapshotsByUser.set(userHash, userStore);
  }

  const id = snapshot.id ?? randomUUID();
  const existing = userStore.get(id);
  const createdAt =
    existing?.createdAt ?? snapshot.createdAt ?? new Date().toISOString();

  const full: AuraPocketMissionSnapshot = {
    ...snapshot,
    id,
    userIdHash: userHash,
    createdAt,
    syncState: snapshot.syncState ?? existing?.syncState ?? "local_only",
    stopped: snapshot.stopped ?? existing?.stopped ?? false,
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
  return snap;
}

export function listSnapshots(userId: string): AuraPocketMissionSnapshot[] {
  const userHash = hashUserId(userId);
  const userStore = snapshotsByUser.get(userHash);
  if (!userStore) return [];
  return [...userStore.values()].filter((s) => s.syncState !== "deleted");
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

export function clearUserOnSignOut(userId: string): void {
  snapshotsByUser.delete(hashUserId(userId));
}
