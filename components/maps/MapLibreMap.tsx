"use client";

import { useMemo } from "react";
import Map, { NavigationControl } from "react-map-gl/maplibre";

import { OsmAttribution } from "@/components/maps/OsmAttribution";

import "maplibre-gl/dist/maplibre-gl.css";

type MapLibreMapProps = {
  center: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
};

export function MapLibreMap({
  center,
  zoom = 12,
  className = "h-80 w-full rounded-lg border",
  children,
}: MapLibreMapProps) {
  const initialViewState = useMemo(
    () => ({
      longitude: center.lng,
      latitude: center.lat,
      zoom,
    }),
    [center.lat, center.lng, zoom]
  );

  return (
    <div className={`relative ${className}`}>
      <Map
        initialViewState={initialViewState}
        mapStyle="https://tiles.openfreemap.org/styles/liberty"
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />
        {children}
      </Map>
      <OsmAttribution />
    </div>
  );
}
