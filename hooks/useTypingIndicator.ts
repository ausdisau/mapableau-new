"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getRealtimeAdapter } from "@/lib/realtime/realtime-adapter";

export function useTypingIndicator(threadId: string | null, profileId: string) {
  const [typingProfileIds, setTypingProfileIds] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!threadId) return;

    let unsubscribe: (() => void) | undefined;
    const adapter = getRealtimeAdapter();

    (async () => {
      const off = await adapter.subscribeToThread(threadId, {
        onTypingStart: (id) => {
          if (id === profileId) return;
          setTypingProfileIds((prev) =>
            prev.includes(id) ? prev : [...prev, id]
          );
        },
        onTypingStop: (id) => {
          setTypingProfileIds((prev) => prev.filter((p) => p !== id));
        },
      });
      unsubscribe = off;
    })();

    return () => unsubscribe?.();
  }, [threadId, profileId]);

  const notifyTyping = useCallback(() => {
    if (!threadId) return;
    const adapter = getRealtimeAdapter();
    adapter.publishTypingStarted(threadId, profileId).catch(() => undefined);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      adapter.publishTypingStopped(threadId, profileId).catch(() => undefined);
    }, 2000);
  }, [threadId, profileId]);

  return { typingProfileIds, notifyTyping };
}
