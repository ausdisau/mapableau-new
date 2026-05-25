"use client";

import { useCallback, useEffect, useState } from "react";

import {
  discardDraft,
  enqueueDraft,
  getDraftByKey,
  listDrafts,
} from "@/lib/offline/offline-queue-service";
import type { OfflineDraftType } from "@/lib/offline/offline-policy";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";

export function useOfflineQueue(key: string, type: OfflineDraftType = "service_log") {
  const { online } = useNetworkStatus();
  const [hasDraft, setHasDraft] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const draft = await getDraftByKey(key);
      setHasDraft(Boolean(draft));
    } catch {
      setHasDraft(false);
    }
  }, [key]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveDraft = useCallback(
    async (payload: Record<string, unknown>) => {
      await enqueueDraft(type, key, payload);
      setHasDraft(true);
    },
    [key, type]
  );

  const discard = useCallback(async () => {
    const draft = await getDraftByKey(key);
    if (draft) await discardDraft(draft.id);
    setHasDraft(false);
  }, [key]);

  return {
    online,
    hasDraft,
    saveDraft,
    discard,
    listDrafts,
    refresh,
  };
}
