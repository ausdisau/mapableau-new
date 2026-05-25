"use client";

import { useCallback, useEffect, useState } from "react";

export function useFeatureFlag(key: string): {
  enabled: boolean;
  loading: boolean;
} {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/feature-flags/evaluate?keys=${encodeURIComponent(key)}`
      );
      if (!res.ok) {
        setEnabled(false);
        return;
      }
      const data = await res.json();
      setEnabled(Boolean(data.flags?.[key]));
    } catch {
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    void load();
  }, [load]);

  return { enabled, loading };
}

export function useFeatureFlags(keys: string[]): {
  flags: Record<string, boolean>;
  loading: boolean;
} {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!keys.length) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/feature-flags/evaluate?keys=${keys.map(encodeURIComponent).join(",")}`)
      .then((r) => (r.ok ? r.json() : { flags: {} }))
      .then((d) => setFlags(d.flags ?? {}))
      .catch(() => setFlags({}))
      .finally(() => setLoading(false));
  }, [keys.join(",")]);

  return { flags, loading };
}
