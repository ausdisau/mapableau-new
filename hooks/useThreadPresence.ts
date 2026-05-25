"use client";

import { useEffect, useState } from "react";

import { getRealtimeAdapter } from "@/lib/realtime/realtime-adapter";

export function useThreadPresence(
  threadId: string | null,
  profileId: string
) {
  const [onlineProfileIds, setOnlineProfileIds] = useState<string[]>([]);

  useEffect(() => {
    if (!threadId) return;

    let unsubscribe: (() => void) | undefined;
    const adapter = getRealtimeAdapter();

    (async () => {
      const off = await adapter.subscribeToThread(threadId, {
        onPresence: (id, state) => {
          setOnlineProfileIds((prev) => {
            if (state === "offline") return prev.filter((p) => p !== id);
            if (prev.includes(id)) return prev;
            return [...prev, id];
          });
        },
      });
      unsubscribe = off;
      await adapter.publishPresence(threadId, profileId, "online");
    })();

    return () => {
      adapter.publishPresence(threadId!, profileId, "offline").catch(() => undefined);
      unsubscribe?.();
    };
  }, [threadId, profileId]);

  return { onlineProfileIds };
}
