"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getRealtimeAdapter } from "@/lib/realtime/realtime-adapter";
import type { Message } from "@/types/messages";

export function useMessageRealtime(threadId: string | null, onRefetch: () => void) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);
  const onRefetchRef = useRef(onRefetch);
  onRefetchRef.current = onRefetch;

  const appendMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  useEffect(() => {
    if (!threadId) return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const adapter = getRealtimeAdapter();
      const off = await adapter.subscribeToThread(threadId, {
        onMessage: (message) => {
          appendMessage(message);
        },
      });
      if (cancelled) {
        await off();
        return;
      }
      unsubscribe = off;
      setConnected(true);
    })();

    const onOnline = () => {
      onRefetchRef.current();
    };
    window.addEventListener("online", onOnline);

    return () => {
      cancelled = true;
      setConnected(false);
      window.removeEventListener("online", onOnline);
      unsubscribe?.();
    };
  }, [threadId, appendMessage]);

  return { messages, setMessages, connected, appendMessage };
}
