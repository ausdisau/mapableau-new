"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import dynamic from "next/dynamic";

import type { AdCreativePayload } from "@/lib/ads/types";

const AccessMapLayer = dynamic(
  () => import("@/components/access/AccessMapLayer").then((m) => m.AccessMapLayer),
  { ssr: false, loading: () => <p className="p-4 text-sm">Loading map…</p> }
);

export function AccessMap({
  places,
  selectedId,
  onSelect,
  sponsoredMarkers,
}: {
  places: { id: string; name: string; latitude: number; longitude: number }[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  sponsoredMarkers?: Array<{
    creative: AdCreativePayload;
    clickPath: string;
    decisionId: string;
  }>;
}) {
  return (
    <div
      className="h-[min(50vh,400px)] w-full overflow-hidden rounded-lg border border-border"
      role="application"
      aria-label="Map of access-rated places. Use the list view for a text alternative."
    >
      <AccessMapLayer
        places={places}
        selectedId={selectedId}
        onSelect={onSelect}
        sponsoredMarkers={sponsoredMarkers}
      />
    </div>
  );
}
