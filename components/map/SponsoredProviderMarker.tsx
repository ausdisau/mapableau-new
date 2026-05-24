"use client";

import L from "leaflet";
import { Marker, Popup } from "react-leaflet";

import { SponsoredLabel } from "@/components/ads/SponsoredLabel";
import { WhyAmISeeingThis } from "@/components/ads/WhyAmISeeingThis";
import { ReportAdButton } from "@/components/ads/ReportAdButton";
import type { SponsoredAdResult } from "@/types/ads";

const sponsoredMarkerIcon = L.divIcon({
  className: "sponsored-marker-icon motion-reduce:animate-none",
  html: `<div style="width:26px;height:26px;background:#b45309;border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:white" aria-hidden="true">S</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

type SponsoredProviderMarkerProps = {
  ad: SponsoredAdResult;
  onOpen?: (ad: SponsoredAdResult) => void;
  onHidden?: (campaignId: string) => void;
};

export function SponsoredProviderMarker({
  ad,
  onOpen,
  onHidden,
}: SponsoredProviderMarkerProps) {
  if (ad.latitude == null || ad.longitude == null) return null;

  const trackOpen = async () => {
    onOpen?.(ad);
    await fetch("/api/ads/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId: ad.campaignId,
        creativeId: ad.creativeId,
        eventType: "map_pin_opened",
        placementSurface: "map",
      }),
    });
  };

  return (
    <Marker
      position={[ad.latitude, ad.longitude]}
      icon={sponsoredMarkerIcon}
      eventHandlers={{ popupopen: trackOpen }}
    >
      <Popup className="sponsored-popup" minWidth={240}>
        <div className="min-w-[220px] max-w-[280px] text-xs leading-tight">
          <div className="mb-2 flex items-center gap-2">
            <SponsoredLabel compact />
          </div>
          <h3 className="font-semibold text-sm mb-1">{ad.headline}</h3>
          {ad.description ? (
            <p className="text-muted-foreground mb-2">{ad.description}</p>
          ) : null}
          {ad.ctaUrl ? (
            <a
              href={ad.ctaUrl}
              className="text-primary hover:underline font-medium"
              onClick={async () => {
                await fetch("/api/ads/events", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    campaignId: ad.campaignId,
                    creativeId: ad.creativeId,
                    eventType: "cta_clicked",
                    placementSurface: "map",
                  }),
                });
              }}
            >
              {ad.ctaLabel ?? "Learn more"}
            </a>
          ) : null}
          <div className="mt-3 space-y-2 border-t border-border pt-2">
            <WhyAmISeeingThis reasons={ad.targetingSummary} />
            <ReportAdButton
              campaignId={ad.campaignId}
              onHidden={() => onHidden?.(ad.campaignId)}
            />
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
