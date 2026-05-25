"use client";

import { useEffect } from "react";

import { SponsoredProviderMarker } from "@/components/map/SponsoredProviderMarker";
import type { SponsoredAdResult } from "@/types/ads";

type SponsoredMapLayerProps = {
  ads: SponsoredAdResult[];
  onHidden?: (campaignId: string) => void;
};

export function SponsoredMapLayer({ ads, onHidden }: SponsoredMapLayerProps) {
  useEffect(() => {
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
  }, [ads]);

  return (
    <>
      {ads.map((ad) => (
        <SponsoredProviderMarker key={ad.campaignId} ad={ad} onHidden={onHidden} />
      ))}
    </>
  );
}
