"use client";

import { useCallback, useEffect, useState } from "react";

import type { ConferenceMode, ConferenceSession } from "@/types/messages";

export function useConferenceSession(threadId: string | null) {
  const [session, setSession] = useState<ConferenceSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/messages/threads/${threadId}/conference`);
      if (!res.ok) {
        setSession(null);
        return;
      }
      const data = await res.json();
      setSession(data.session ?? null);
    } catch {
      setError("Could not load call status.");
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const start = useCallback(
    async (mode: ConferenceMode) => {
      if (!threadId) return null;
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/messages/threads/${threadId}/conference`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not start call.");
          return null;
        }
        setSession(data.session);
        return data.session as ConferenceSession;
      } catch {
        setError("Could not start call.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [threadId]
  );

  const end = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    try {
      await fetch(`/api/messages/threads/${threadId}/conference/end`, {
        method: "POST",
      });
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  return { session, loading, error, refresh, start, end };
}
