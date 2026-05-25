"use client";

import { useCallback, useEffect, useState } from "react";

import type { OfflineDraftType } from "@/lib/offline/offline-policy";
import { enqueueDraft, getDraftByKey } from "@/lib/offline/offline-queue-service";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";

const LS_PREFIX = "mapable-form-draft:";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export function useFormAutosave(
  key: string,
  initial = "",
  draftType: OfflineDraftType = "service_log"
) {
  const { online } = useNetworkStatus();
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<AutosaveStatus>("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(`${LS_PREFIX}${key}`);
    if (stored) setValue(stored);
    void getDraftByKey(key).then((d) => {
      if (d?.payload?.text && typeof d.payload.text === "string") {
        setValue(d.payload.text);
      }
    });
  }, [key]);

  const persist = useCallback(
    async (text: string) => {
      setStatus("saving");
      try {
        localStorage.setItem(`${LS_PREFIX}${key}`, text);
        if (!online) {
          await enqueueDraft(draftType, key, { text });
        }
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    },
    [key, online, draftType]
  );

  useEffect(() => {
    if (!value) return;
    const t = setTimeout(() => void persist(value), 800);
    return () => clearTimeout(t);
  }, [value, persist]);

  return { value, setValue, status, online };
}
