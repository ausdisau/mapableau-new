"use client";

import { useEffect, useMemo } from "react";

import { useGeoJsonLayer } from "@/components/map/layers/useGeoJsonLayer";
import { getMapConfig } from "@/lib/map/map-config";
import { MAP_LAYERS, MAP_SOURCES } from "@/lib/map/map-layer-ids";
import { emptyFeatureCollection } from "@/lib/map/map-sources";
import type { SponsoredAdResult } from "@/types/ads";

function adsToFeatureCollection(ads: SponsoredAdResult[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = ads
    .filter((ad) => ad.latitude != null && ad.longitude != null && ad.verificationPassed)
    .map((ad) => ({
      type: "Feature" as const,
      id: ad.campaignId,
      geometry: {
        type: "Point" as const,
        coordinates: [ad.longitude!, ad.latitude!],
      },
      properties: {
        id: ad.campaignId,
        creativeId: ad.creativeId,
        headline: ad.headline,
        description: ad.description ?? "",
        isSponsored: true,
        ctaUrl: ad.ctaUrl ?? "",
        ctaLabel: ad.ctaLabel ?? "Learn more",
      },
    }));

  return { type: "FeatureCollection", features };
}

type SponsoredServicesLayerProps = {
  ads: SponsoredAdResult[];
};

export function SponsoredServicesLayer({ ads }: SponsoredServicesLayerProps) {
  const enabled = getMapConfig().MAP_ENABLE_SPONSORED_LAYER !== false;
  const data = useMemo(() => adsToFeatureCollection(ads), [ads]);

  useGeoJsonLayer({
    sourceId: MAP_SOURCES.sponsoredServices,
    data: data.features.length > 0 ? data : emptyFeatureCollection(),
    enabled,
    layers: [
      {
        id: MAP_LAYERS.sponsoredServicesCircle,
        type: "circle",
        source: MAP_SOURCES.sponsoredServices,
        paint: {
          "circle-radius": 10,
          "circle-color": "#b45309",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      },
      {
        id: MAP_LAYERS.sponsoredServicesSymbol,
        type: "symbol",
        source: MAP_SOURCES.sponsoredServices,
        layout: {
          "text-field": "S",
          "text-size": 11,
          "text-font": ["Open Sans Bold"],
        },
        paint: {
          "text-color": "#ffffff",
        },
      },
    ],
  });

  useEffect(() => {
    if (!enabled) return;
    for (const ad of ads) {
      void fetch("/api/ads/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: ad.campaignId,
          creativeId: ad.creativeId,
          eventType: "impression",
          placementSurface: "map",
        }),
      });
    }
  }, [ads, enabled]);

  return null;
}
