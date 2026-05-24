"use client";

import dynamic from "next/dynamic";

import type { Provider } from "@/app/provider-finder/providers";
import { Card } from "@/components/ui/card";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

type ProviderFinderMapPanelProps = {
  mapProviders: Provider[];
  userLocation: { lat: number; lng: number } | null;
  selectedProvider: Provider | null;
  showLocationHint: boolean;
  className?: string;
};

export function ProviderFinderMapPanel({
  mapProviders,
  userLocation,
  selectedProvider,
  showLocationHint,
  className,
}: ProviderFinderMapPanelProps) {
  return (
    <section
      id="map"
      className={className}
      aria-labelledby="provider-map-heading"
    >
      <h2 id="provider-map-heading" className="mapable-display text-sm font-semibold text-mapable-navy">
        Map preview
      </h2>
      <p className="mapable-soft mt-1 text-xs leading-relaxed text-slate-600">
        Map view can show nearby providers, accessible transport options, travel buffers and
        venue access notes together.
      </p>
      {showLocationHint ? (
        <Card variant="outlined" className="mt-3 p-3">
          <p className="text-sm text-muted-foreground">
            Set a suburb or use &quot;Use my location&quot; to see providers on the map.
          </p>
        </Card>
      ) : null}
      <div className="mt-3 overflow-hidden rounded-xl border border-border/60 shadow-sm">
        <Map
          providers={mapProviders}
          userPosition={userLocation}
          centerOnProvider={selectedProvider}
        />
      </div>
    </section>
  );
}
