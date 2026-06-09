"use client";

import { useEffect, useState } from "react";

import { createMessageSubscription } from "@/lib/realtime/realtime-subscription-factory";
import { getRealtimeProvider } from "@/lib/realtime/supabase-realtime-adapter";
import type { RealtimeEvent } from "@/lib/realtime/supabase-realtime-adapter";

export function useMessageRealtime(
  conversationId: string,
  fetchLatestMessageId: () => Promise<string | null>,
  onRefresh: () => void
) {
  const [connected, setConnected] = useState(false);
  const provider = getRealtimeProvider();

  useEffect(() => {
    const unsub = createMessageSubscription({
      conversationId,
      fetchLatest: async () => {
        const id = await fetchLatestMessageId();
        return id ? { messageId: id } : null;
      },
      onEvent: (event: RealtimeEvent) => {
        if (event.type === "message:new") onRefresh();
      },
    });
    setConnected(true);
    return () => {
      unsub();
      setConnected(false);
    };
  }, [conversationId, fetchLatestMessageId, onRefresh]);

  return { connected, provider };
}
