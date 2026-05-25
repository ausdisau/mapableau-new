"use client";

import { useQuery } from "@tanstack/react-query";

import type { Provider } from "@/app/provider-finder/providers";

export type ProviderMapPinsParams = {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  state?: string;
  q?: string;
  limit?: number;
  enabled?: boolean;
};

export const PROVIDER_MAP_PINS_QUERY_KEY = "provider-map-pins";

function buildMapPinsUrl(params: ProviderMapPinsParams): string {
  const sp = new URLSearchParams();
  if (params.lat != null && params.lng != null) {
    sp.set("lat", String(params.lat));
    sp.set("lng", String(params.lng));
  }
  if (params.radiusKm != null) sp.set("radiusKm", String(params.radiusKm));
  if (params.state) sp.set("state", params.state);
  if (params.q?.trim()) sp.set("q", params.q.trim());
  sp.set("limit", String(params.limit ?? 500));
  return `/api/ndis/providers/map?${sp.toString()}`;
}

async function fetchMapPins(
  params: ProviderMapPinsParams,
): Promise<Provider[]> {
  const res = await fetch(buildMapPinsUrl(params));
  const json = (await res.json()) as {
    success: boolean;
    providers?: Provider[];
    error?: string;
    hint?: string;
  };
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? json.hint ?? "Failed to load map pins");
  }
  return json.providers ?? [];
}

export function useProviderMapPins(params: ProviderMapPinsParams) {
  const enabled = params.enabled !== false;
  return useQuery({
    queryKey: [
      PROVIDER_MAP_PINS_QUERY_KEY,
      params.lat,
      params.lng,
      params.radiusKm,
      params.state,
      params.q,
      params.limit,
    ],
    queryFn: () => fetchMapPins(params),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
