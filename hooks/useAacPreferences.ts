"use client";

import { useCallback, useEffect, useState } from "react";

import type { AacPhrase } from "@/types/messages";

export function useAacPreferences() {
  const [phrases, setPhrases] = useState<AacPhrase[]>([]);
  const [showAacByDefault, setShowAacByDefault] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/aac/phrases");
      if (!res.ok) return;
      const data = await res.json();
      setPhrases(data.phrases ?? []);
      setShowAacByDefault(Boolean(data.showAacByDefault));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    phrases,
    showAacByDefault,
    loading,
    refresh,
    setShowAacByDefault,
  };
}
