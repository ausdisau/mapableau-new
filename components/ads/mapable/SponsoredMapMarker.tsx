"use client";

import { Marker } from "react-map-gl/maplibre";

import { SponsoredDisclosure } from "@/components/ads/mapable/SponsoredDisclosure";
import type { AdCreativePayload } from "@/lib/ads/types";

type SponsoredMapMarkerProps = {
  creative: AdCreativePayload;
  selected?: boolean;
  onSelect?: () => void;
  clickHref?: string;
};

/**
 * Internal-only sponsored geographic marker.
 * External networks must not inject HTML into MapLibre markers.
 */
export function SponsoredMapMarker({
  creative,
  selected,
  onSelect,
  clickHref,
}: SponsoredMapMarkerProps) {
  if (creative.latitude == null || creative.longitude == null) {
    return null;
  }

  const name = creative.businessName ?? creative.headline;

  return (
    <Marker
      latitude={creative.latitude}
      longitude={creative.longitude}
      anchor="bottom"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onSelect?.();
      }}
    >
      <div className="flex flex-col items-center gap-1">
        <SponsoredDisclosure businessName={name} className="rounded bg-background/95 px-1 text-[10px] font-semibold uppercase text-muted-foreground shadow" />
        {clickHref ? (
          <a
            href={clickHref}
            className={`min-h-11 rounded px-2 py-1 text-xs font-semibold shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              selected
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background text-foreground"
            }`}
            aria-label={`Sponsored listing: ${name}`}
            rel="noopener noreferrer"
            data-ads-kind="sponsored-marker"
          >
            {name.slice(0, 24)}
          </a>
        ) : (
          <button
            type="button"
            aria-label={`Sponsored listing: ${name}`}
            className={`min-h-11 rounded px-2 py-1 text-xs font-semibold shadow ${
              selected
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background text-foreground"
            }`}
            data-ads-kind="sponsored-marker"
          >
            {name.slice(0, 24)}
          </button>
        )}
      </div>
    </Marker>
  );
}
