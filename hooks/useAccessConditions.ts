"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchAccessConditions,
  type AccessConditionsResponse,
  type GaisBoundsInput,
} from "@/lib/gais/client/fetch-events";
import type { GaisAccessConditionEvent } from "@/lib/gais/conditions";

const DEBOUNCE_MS = 400;

export type UseAccessConditionsResult = {
  events: GaisAccessConditionEvent[];
  meta: AccessConditionsResponse["meta"] | null;
  activeAt: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

export function useAccessConditions(
  input: {
    bounds?: GaisBoundsInput | null;
    placeId?: string;
    graphId?: string;
  },
  enabled: boolean,
): UseAccessConditionsResult {
  const [events, setEvents] = useState<GaisAccessConditionEvent[]>([]);
  const [meta, setMeta] = useState<AccessConditionsResponse["meta"] | null>(null);
  const [activeAt, setActiveAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyRef = useRef("");

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAccessConditions(
        {
          bounds: input.bounds ?? undefined,
          placeId: input.placeId,
          graphId: input.graphId,
          limit: 50,
        },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setEvents(data.events);
      setMeta(data.meta);
      setActiveAt(data.activeAt);
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(e instanceof Error ? e.message : "Failed to load access conditions");
      setEvents([]);
      setMeta(null);
      setActiveAt(null);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [input.bounds, input.placeId, input.graphId]);

  const refresh = useCallback(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!enabled) {
      setEvents([]);
      setMeta(null);
      setActiveAt(null);
      setLoading(false);
      return;
    }

    if (!input.bounds && !input.placeId && !input.graphId) return;

    const key = JSON.stringify(input);
    if (key === keyRef.current) return;
    keyRef.current = key;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void load();
    }, input.bounds ? DEBOUNCE_MS : 0);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [enabled, input, load]);

  return { events, meta, activeAt, loading, error, refresh };
}
