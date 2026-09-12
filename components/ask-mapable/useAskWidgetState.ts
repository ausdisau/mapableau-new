"use client";

import { useCallback, useEffect, useState } from "react";

import { ASK_WIDGET_STORAGE, type AskWidgetTab } from "./types";

function readBool(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const v = sessionStorage.getItem(key);
    if (v === null) return fallback;
    return v === "1" || v === "true";
  } catch {
    return fallback;
  }
}

function readTab(fallback: AskWidgetTab): AskWidgetTab {
  if (typeof window === "undefined") return fallback;
  try {
    const v = sessionStorage.getItem(ASK_WIDGET_STORAGE.tab);
    if (v === "chat" || v === "actions" || v === "history") return v;
  } catch {
    /* ignore */
  }
  return fallback;
}

export function useAskWidgetState(defaultTab: AskWidgetTab = "chat") {
  const [open, setOpenState] = useState(false);
  const [activeTab, setActiveTabState] = useState<AskWidgetTab>(defaultTab);
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(
    null,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOpenState(readBool(ASK_WIDGET_STORAGE.open, false));
    setActiveTabState(readTab(defaultTab));
    try {
      setActiveSessionIdState(
        sessionStorage.getItem(ASK_WIDGET_STORAGE.sessionId),
      );
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [defaultTab]);

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    try {
      sessionStorage.setItem(ASK_WIDGET_STORAGE.open, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setOpenState((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem(ASK_WIDGET_STORAGE.open, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const setActiveTab = useCallback((tab: AskWidgetTab) => {
    setActiveTabState(tab);
    try {
      sessionStorage.setItem(ASK_WIDGET_STORAGE.tab, tab);
    } catch {
      /* ignore */
    }
  }, []);

  const setActiveSessionId = useCallback((id: string | null) => {
    setActiveSessionIdState(id);
    try {
      if (id) sessionStorage.setItem(ASK_WIDGET_STORAGE.sessionId, id);
      else sessionStorage.removeItem(ASK_WIDGET_STORAGE.sessionId);
    } catch {
      /* ignore */
    }
  }, []);

  return {
    open,
    setOpen,
    toggle,
    activeTab,
    setActiveTab,
    activeSessionId,
    setActiveSessionId,
    hydrated,
  };
}
