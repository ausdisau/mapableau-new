
import type { MapableApiClient } from "@mapable/api-client";
import { readQueue, writeQueue } from "@/offline/store";

export async function pullAndReconcile(client: MapableApiClient, cursor: string | null) {
  return client.syncPull(cursor);
}

export async function pushQueuedMutations(client: MapableApiClient) {
  const queue = await readQueue();
  const pending = queue.filter((q) => q.status === "queued" || q.status === "failed");
  if (!pending.length) return { accepted: 0, conflicts: [] as unknown[] };
  const result = await client.syncPush(pending);
  const conflictIds = new Set(
    result.conflicts
      .map((c) => (c as { idempotencyKey?: string }).idempotencyKey)
      .filter(Boolean),
  );
  const next = queue.map((item) => {
    if (conflictIds.has(item.idempotencyKey)) {
      return { ...item, status: "conflict" as const };
    }
    if (pending.some((p) => p.id === item.id)) {
      return { ...item, status: "completed" as const };
    }
    return item;
  });
  await writeQueue(next);
  return result;
}
