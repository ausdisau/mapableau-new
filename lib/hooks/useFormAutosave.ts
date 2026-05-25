"use client";

import { useCallback, useEffect, useState } from "react";

import type { OfflineDraftType } from "@/lib/offline/offline-policy";
import {
  discardDraft,
  enqueueDraft,
  getDraftByKey,
} from "@/lib/offline/offline-queue-service";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";

const LS_PREFIX = "mapable-form-draft:";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

/** Private messages must not use localStorage (policy). */
export type AutosavePersistTarget = "localStorage" | "offlineOnly";

export function defaultPersistTarget(
  draftType: OfflineDraftType
): AutosavePersistTarget {
  return draftType === "message" ? "offlineOnly" : "localStorage";
}

async function clearDraftStorage(key: string, useLocalStorage: boolean) {
  if (typeof window === "undefined") return;
  if (useLocalStorage) {
    localStorage.removeItem(`${LS_PREFIX}${key}`);
  }
  const draft = await getDraftByKey(key);
  if (draft) await discardDraft(draft.id);
}

export function useFormAutosave(
  key: string,
  initial = "",
  draftType: OfflineDraftType = "service_log",
  persistTarget: AutosavePersistTarget = defaultPersistTarget(draftType)
) {
  const { online } = useNetworkStatus();
  const useLocalStorage = persistTarget === "localStorage";
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<AutosaveStatus>("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (useLocalStorage) {
      const stored = localStorage.getItem(`${LS_PREFIX}${key}`);
      if (stored) setValue(stored);
    }
    void getDraftByKey(key).then((d) => {
      if (d?.payload?.text && typeof d.payload.text === "string") {
        setValue(d.payload.text);
      }
    });
  }, [key, useLocalStorage]);

  const persist = useCallback(
    async (text: string) => {
      setStatus("saving");
      try {
        if (useLocalStorage) {
          localStorage.setItem(`${LS_PREFIX}${key}`, text);
        }
        if (!online) {
          await enqueueDraft(draftType, key, { text });
        }
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    },
    [key, online, draftType, useLocalStorage]
  );

  useEffect(() => {
    if (value === "") {
      void clearDraftStorage(key, useLocalStorage).then(() => setStatus("idle"));
      return;
    }
    const t = setTimeout(() => void persist(value), 800);
    return () => clearTimeout(t);
  }, [value, persist, key, useLocalStorage]);

  return { value, setValue, status, online };
}
