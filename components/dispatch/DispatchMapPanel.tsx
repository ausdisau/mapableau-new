"use client";

import dynamic from "next/dynamic";

import type { MapMarker } from "@/components/maps/SchedulingMarkers";

const MapLibreMap = dynamic(
  () => import("@/components/maps/MapLibreMap").then((m) => m.MapLibreMap),
  { ssr: false }
);
const SchedulingMarkers = dynamic(
  () =>
    import("@/components/maps/SchedulingMarkers").then((m) => m.SchedulingMarkers),
  { ssr: false }
);

type DispatchMapPanelProps = {
  markers: MapMarker[];
  center: { lat: number; lng: number };
};

export function DispatchMapPanel({ markers, center }: DispatchMapPanelProps) {
  return (
    <MapLibreMap center={center} className="h-96 w-full rounded-lg border">
      <SchedulingMarkers markers={markers} />
    </MapLibreMap>
  );
}
