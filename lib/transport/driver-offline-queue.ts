/**
 * Client-side offline event queue for the driver field app.
 * Events are stored in localStorage and flushed with idempotency keys.
 */

export type QueuedDriverEvent = {
  id: string;
  tripId: string;
  eventType: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  createdAt: string;
  synced: boolean;
  lastError?: string;
};

const STORAGE_KEY = "mapable.transport.driverOfflineQueue.v1";

function readQueue(): QueuedDriverEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedDriverEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(events: QueuedDriverEvent[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function enqueueDriverEvent(
  event: Omit<QueuedDriverEvent, "synced" | "createdAt">
): QueuedDriverEvent {
  const queue = readQueue();
  const existing = queue.find((e) => e.idempotencyKey === event.idempotencyKey);
  if (existing) return existing;
  const row: QueuedDriverEvent = {
    ...event,
    createdAt: new Date().toISOString(),
    synced: false,
  };
  writeQueue([...queue, row]);
  return row;
}

export function listPendingDriverEvents(): QueuedDriverEvent[] {
  return readQueue().filter((e) => !e.synced);
}

export async function flushDriverOfflineQueue(
  postEvent: (event: QueuedDriverEvent) => Promise<boolean>
): Promise<{ synced: number; failed: number }> {
  const pending = listPendingDriverEvents();
  let synced = 0;
  let failed = 0;
  const queue = readQueue();
  for (const event of pending) {
    try {
      const ok = await postEvent(event);
      if (ok) {
        const idx = queue.findIndex((e) => e.id === event.id);
        if (idx >= 0) queue[idx] = { ...queue[idx], synced: true, lastError: undefined };
        synced += 1;
      } else {
        failed += 1;
      }
    } catch (err) {
      const idx = queue.findIndex((e) => e.id === event.id);
      if (idx >= 0) {
        queue[idx] = {
          ...queue[idx],
          lastError: err instanceof Error ? err.message : "sync failed",
        };
      }
      failed += 1;
    }
  }
  writeQueue(queue);
  return { synced, failed };
}
