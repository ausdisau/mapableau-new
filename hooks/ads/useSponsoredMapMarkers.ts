"use client";

import { useEffect, useState } from "react";

import type { AdCreativePayload, AdPlacementFill } from "@/lib/ads/types";

/**
 * Fetch sponsored marker creatives for Access map (internal only).
 * Returns empty when ads flags are off or no fill.
 */
export function useSponsoredMapMarkers(options: {
  enabled: boolean;
  regionCode?: string;
  bbox?: [number, number, number, number];
  zoom?: number;
}): {
  markers: Array<{ creative: AdCreativePayload; clickPath: string; decisionId: string }>;
} {
  const [markers, setMarkers] = useState<
    Array<{ creative: AdCreativePayload; clickPath: string; decisionId: string }>
  >([]);

  useEffect(() => {
    if (!options.enabled) {
      setMarkers([]);
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams({
      surface: "access",
      placement: "access.map.sponsored-marker",
    });
    if (options.bbox) params.set("bbox", options.bbox.join(","));
    if (options.zoom != null) params.set("zoom", String(options.zoom));
    if (options.regionCode) params.set("region", options.regionCode);

    fetch(`/api/ads/placements?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as { fill: AdPlacementFill };
      })
      .then((data) => {
        if (cancelled || !data) return;
        if (data.fill.kind === "internal" && data.fill.creative.latitude != null) {
          setMarkers([
            {
              creative: data.fill.creative,
              clickPath: data.fill.clickPath,
              decisionId: data.fill.decisionId,
            },
          ]);
        } else {
          setMarkers([]);
        }
      })
      .catch(() => {
        if (!cancelled) setMarkers([]);
      });

    return () => {
      cancelled = true;
    };
  }, [options.enabled, options.bbox, options.zoom, options.regionCode]);

  return { markers };
}
