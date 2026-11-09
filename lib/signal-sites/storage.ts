import { createSeedWorkspace } from "@/lib/signal-sites/seed";
import {
  EVIDENCE_DB,
  STORAGE_KEY,
  type SignalWorkspace,
} from "@/lib/signal-sites/types";

export function loadWorkspace(): SignalWorkspace {
  if (typeof window === "undefined") return createSeedWorkspace();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedWorkspace();
    const parsed = JSON.parse(raw) as SignalWorkspace;
    if (
      parsed &&
      parsed.version === 1 &&
      Array.isArray(parsed.challenges) &&
      Array.isArray(parsed.observations)
    ) {
      return parsed;
    }
  } catch {
    // fall through to seed
  }
  return createSeedWorkspace();
}

export function saveWorkspace(store: SignalWorkspace): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function openEvidenceDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = window.indexedDB.open(EVIDENCE_DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains("files")) {
        req.result.createObjectStore("files");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

export async function putEvidenceFile(
  key: string,
  file: { name: string; type: string; size: number; blob: Blob },
): Promise<void> {
  const db = await openEvidenceDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put(file, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
  });
  db.close();
}

export async function getEvidenceFile(
  key: string,
): Promise<{ name: string; type: string; size: number; blob: Blob } | null> {
  const db = await openEvidenceDb();
  const value = await new Promise<unknown>((resolve, reject) => {
    const tx = db.transaction("files", "readonly");
    const req = tx.objectStore("files").get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB read failed"));
  });
  db.close();
  return (value as { name: string; type: string; size: number; blob: Blob }) || null;
}

export async function deleteEvidenceFile(key: string): Promise<void> {
  const db = await openEvidenceDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB delete failed"));
  });
  db.close();
}

export async function eraseEvidenceFiles(): Promise<void> {
  const db = await openEvidenceDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB clear failed"));
  });
  db.close();
}

export function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `m-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 5000);
}
