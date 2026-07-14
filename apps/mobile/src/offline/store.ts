
import * as SecureStore from "expo-secure-store";
import { mayCacheOffline, type OfflineDataClass, type QueuedMutation } from "./policy";

const QUEUE_KEY = "mapable.offline.queue.v1";
const CACHE_PREFIX = "mapable.offline.cache.";

export async function readQueue(): Promise<QueuedMutation[]> {
  const raw = await SecureStore.getItemAsync(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedMutation[];
  } catch {
    return [];
  }
}

export async function writeQueue(items: QueuedMutation[]): Promise<void> {
  await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(items));
}

export async function enqueueMutation(item: QueuedMutation): Promise<void> {
  const queue = await readQueue();
  if (queue.some((q) => q.idempotencyKey === item.idempotencyKey)) return;
  queue.push(item);
  await writeQueue(queue);
}

export async function cacheAllowedRecord(
  dataClass: OfflineDataClass,
  key: string,
  value: unknown,
  expiresAt: string,
): Promise<void> {
  if (!mayCacheOffline(dataClass)) {
    throw new Error(`Offline cache denied for ${dataClass}`);
  }
  await SecureStore.setItemAsync(
    `${CACHE_PREFIX}${dataClass}.${key}`,
    JSON.stringify({ value, expiresAt, dataClass }),
  );
}

export async function clearOfflineOnLogout(): Promise<void> {
  await SecureStore.deleteItemAsync(QUEUE_KEY);
}
