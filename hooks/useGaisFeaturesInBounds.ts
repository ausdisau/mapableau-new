"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchGaisFeaturesInBounds,
  GAIS_CLIENT_FEATURE_LIMIT,
  type GaisBoundsInput,
  type GaisFeaturesResponse,
} from "@/lib/gais/client/fetch-features";
import type { GaisGeoJsonFeature } from "@/lib/gais/geojson/converters";

const DEBOUNCE_MS = 400;

export type UseGaisFeaturesResult = {
  features: GaisGeoJsonFeature[];
  meta: GaisFeaturesResponse["meta"] | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

export function useGaisFeaturesInBounds(
  bounds: GaisBoundsInput | null,
  enabled: boolean,
): UseGaisFeaturesResult {
  const [features, setFeatures] = useState<GaisGeoJsonFeature[]>([]);
  const [meta, setMeta] = useState<GaisFeaturesResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boundsKeyRef = useRef<string>("");

  const load = useCallback(async (nextBounds: GaisBoundsInput) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchGaisFeaturesInBounds(
        { ...nextBounds, limit: GAIS_CLIENT_FEATURE_LIMIT },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setFeatures(data.features);
      setMeta(data.meta);
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(e instanceof Error ? e.message : "Failed to load accessibility information");
      setFeatures([]);
      setMeta(null);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    if (bounds) void load(bounds);
  }, [bounds, load]);

  useEffect(() => {
    if (!enabled || !bounds) {
      setFeatures([]);
      setMeta(null);
      setLoading(false);
      return;
    }

    const key = JSON.stringify(bounds);
    if (key === boundsKeyRef.current) return;
    boundsKeyRef.current = key;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void load(bounds);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [bounds, enabled, load]);

  return { features, meta, loading, error, refresh };
}
