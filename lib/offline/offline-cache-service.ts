import { canCacheContentType } from "@/lib/offline/offline-policy";

const DB_NAME = "mapable-offline-cache";
const STORE = "safe-cache";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    };
  });
}

export async function setSafeCacheEntry(
  contentType: string,
  key: string,
  payload: unknown
): Promise<boolean> {
  if (!canCacheContentType(contentType)) return false;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({
      key: `${contentType}:${key}`,
      contentType,
      payload,
      updatedAt: Date.now(),
    });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSafeCacheEntry<T>(
  contentType: string,
  key: string
): Promise<T | null> {
  if (!canCacheContentType(contentType)) return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(`${contentType}:${key}`);
    req.onsuccess = () => {
      const row = req.result as { payload?: T } | undefined;
      resolve(row?.payload ?? null);
    };
    req.onerror = () => reject(req.error);
  });
}
