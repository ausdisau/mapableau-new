"use client";

import { useCallback, useEffect, useState } from "react";

import {
  ASK_WIDGET_STORAGE,
  type AskChatMessage,
  type AskLocalSession,
} from "./types";

function loadSessions(): AskLocalSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(ASK_WIDGET_STORAGE.sessions);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AskLocalSession[];
    return Array.isArray(parsed) ? parsed.slice(0, 20) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: AskLocalSession[]) {
  try {
    sessionStorage.setItem(
      ASK_WIDGET_STORAGE.sessions,
      JSON.stringify(sessions.slice(0, 20)),
    );
  } catch {
    /* ignore */
  }
}

export function useAskLocalSessions(activeSessionId: string | null) {
  const [sessions, setSessions] = useState<AskLocalSession[]>([]);

  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  const ensureSession = useCallback(
    (seedTitle?: string): AskLocalSession => {
      const existing = sessions.find((s) => s.id === activeSessionId);
      if (existing) return existing;
      const session: AskLocalSession = {
        id: `ask-${Date.now()}`,
        title: seedTitle?.slice(0, 60) || "New conversation",
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      const next = [session, ...sessions];
      setSessions(next);
      saveSessions(next);
      return session;
    },
    [activeSessionId, sessions],
  );

  const appendMessages = useCallback(
    (sessionId: string, messages: AskChatMessage[], title?: string) => {
      setSessions((prev) => {
        const idx = prev.findIndex((s) => s.id === sessionId);
        let next: AskLocalSession[];
        if (idx === -1) {
          next = [
            {
              id: sessionId,
              title: title?.slice(0, 60) || "New conversation",
              updatedAt: new Date().toISOString(),
              messages,
            },
            ...prev,
          ];
        } else {
          const current = prev[idx]!;
          next = [...prev];
          next[idx] = {
            ...current,
            title: title?.slice(0, 60) || current.title,
            updatedAt: new Date().toISOString(),
            messages: [...current.messages, ...messages].slice(-40),
          };
        }
        saveSessions(next);
        return next;
      });
    },
    [],
  );

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) ?? null;

  return { sessions, ensureSession, appendMessages, activeSession };
}
