"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchProviderOutlets } from "@/lib/provider/finder/provider-outlets";

/** React Query key for provider-outlets; use for invalidation or prefetch. */
export const PROVIDER_OUTLETS_QUERY_KEY = ["provider-outlets"] as const;

/**
 * Caching: data is considered fresh for 5 minutes (staleTime), then refetched in background.
 * Cached in memory for 30 minutes (gcTime). This does not certify the upstream imported record as current.
 * Requires QueryClientProvider above in the tree (e.g. in root layout).
 */
const STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes
const GC_TIME_MS = 30 * 60 * 1000; // 30 minutes

export function useProviderOutlets() {
  return useQuery({
    queryKey: PROVIDER_OUTLETS_QUERY_KEY,
    queryFn: () => fetchProviderOutlets(),
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
  });
}
