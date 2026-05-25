"use client";

import { useEffect, useState } from "react";

import { createPollingSubscription } from "@/lib/realtime/polling-realtime-adapter";
import {
  getRealtimeProvider,
  subscribeToConversation,
  type RealtimeEvent,
} from "@/lib/realtime/supabase-realtime-adapter";

export function useMessageRealtime(
  conversationId: string,
  fetchLatestMessageId: () => Promise<string | null>,
  onRefresh: () => void,
) {
  const [connected, setConnected] = useState(false);
  const provider = getRealtimeProvider();

  useEffect(() => {
    if (provider === "supabase") {
      const unsub = subscribeToConversation(conversationId, (event) => {
        if (event.type === "message:new") onRefresh();
      });
      setConnected(true);
      return () => {
        unsub();
        setConnected(false);
      };
    }

    const unsub = createPollingSubscription(
      conversationId,
      async () => {
        const id = await fetchLatestMessageId();
        return id ? { messageId: id } : null;
      },
      (event: RealtimeEvent) => {
        if (event.type === "message:new") onRefresh();
      },
    );
    setConnected(true);
    return () => {
      unsub();
      setConnected(false);
    };
  }, [conversationId, fetchLatestMessageId, onRefresh, provider]);

  return { connected, provider };
}
