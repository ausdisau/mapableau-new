"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { SponsoredAdResult } from "@/types/ads";

export function useSponsoredAds(params: {
  surface: "map" | "provider_finder";
  query?: string;
  suburb?: string;
  postcode?: string;
  categories?: string[];
  accessTerms?: string[];
  viewport?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  enabled?: boolean;
}) {
  const [ads, setAds] = useState<SponsoredAdResult[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const searchKey = useMemo(
    () =>
      JSON.stringify({
        surface: params.surface,
        query: params.query,
        suburb: params.suburb,
        postcode: params.postcode,
        categories: params.categories,
        accessTerms: params.accessTerms,
        viewport: params.viewport,
      }),
    [
      params.surface,
      params.query,
      params.suburb,
      params.postcode,
      params.categories,
      params.accessTerms,
      params.viewport,
    ],
  );

  const hideAd = useCallback((campaignId: string) => {
    setHiddenIds((prev) => new Set(prev).add(campaignId));
    setAds((prev) => prev.filter((ad) => ad.campaignId !== campaignId));
  }, []);

  useEffect(() => {
    if (params.enabled === false) return;

    const controller = new AbortController();

    async function load() {
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        if (params.query) qs.set("q", params.query);
        if (params.suburb) qs.set("suburb", params.suburb);
        if (params.postcode) qs.set("postcode", params.postcode);
        if (params.categories?.length) {
          qs.set("categories", params.categories.join(","));
        }
        if (params.accessTerms?.length) {
          qs.set("access", params.accessTerms.join(","));
        }
        if (params.viewport) {
          qs.set("north", String(params.viewport.north));
          qs.set("south", String(params.viewport.south));
          qs.set("east", String(params.viewport.east));
          qs.set("west", String(params.viewport.west));
        }

        const endpoint =
          params.surface === "map"
            ? "/api/ads/map"
            : "/api/ads/provider-finder";

        const res = await fetch(`${endpoint}?${qs.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { ads: SponsoredAdResult[] };
        setAds(data.ads);
      } finally {
        setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [searchKey, params.enabled]);

  const visibleAds = useMemo(
    () => ads.filter((ad) => !hiddenIds.has(ad.campaignId)),
    [ads, hiddenIds],
  );

  return { ads: visibleAds, loading, hideAd };
}
