import type { OfflineDraftType } from "@/lib/offline/offline-policy";

export type QueuedDraft = {
  id: string;
  type: OfflineDraftType;
  key: string;
  payload: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
};

const DB_NAME = "mapable-offline-queue";
const STORE = "drafts";

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
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
  });
}

export async function enqueueDraft(
  type: OfflineDraftType,
  key: string,
  payload: Record<string, unknown>
): Promise<QueuedDraft> {
  const db = await openDb();
  const id = `${type}:${key}`;
  const draft: QueuedDraft = {
    id,
    type,
    key,
    payload,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(draft);
    tx.oncomplete = () => resolve(draft);
    tx.onerror = () => reject(tx.error);
  });
}

export async function listDrafts(): Promise<QueuedDraft[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as QueuedDraft[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

export async function discardDraft(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getDraftByKey(key: string): Promise<QueuedDraft | null> {
  const all = await listDrafts();
  return all.find((d) => d.key === key) ?? null;
}
