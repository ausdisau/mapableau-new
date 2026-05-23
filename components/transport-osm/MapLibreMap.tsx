"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import maplibregl from "maplibre-gl";
import { useEffect, useRef, useId } from "react";

import { transportOsmConfig } from "@/lib/transport-osm/config";

import { OsmAttribution } from "./OsmAttribution";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  kind: "pickup" | "dropoff" | "vehicle";
};

export function MapLibreMap({
  markers,
  ariaLabel = "Trip map",
  height = 320,
}: {
  markers: MapMarker[];
  ariaLabel?: string;
  height?: number;
}) {
  const mapId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center =
      markers.length > 0
        ? { lng: markers[0]!.lng, lat: markers[0]!.lat }
        : { lng: 144.9631, lat: -37.8136 };

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: transportOsmConfig.mapStyleUrl,
      center: [center.lng, center.lat],
      zoom: 11,
      attributionControl: { compact: true },
    });

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      "top-right"
    );

    for (const m of markers) {
      const el = document.createElement("div");
      el.setAttribute("role", "img");
      el.setAttribute(
        "aria-label",
        `${m.kind}: ${m.label}`
      );
      el.className =
        "flex h-8 w-8 items-center justify-center rounded-full border-2 border-foreground bg-background text-xs font-bold shadow";
      el.textContent =
        m.kind === "pickup" ? "P" : m.kind === "dropoff" ? "D" : "V";

      new maplibregl.Marker({ element: el })
        .setLngLat([m.lng, m.lat])
        .addTo(map);
    }

    if (markers.length >= 2) {
      const bounds = new maplibregl.LngLatBounds();
      markers.forEach((m) => bounds.extend([m.lng, m.lat]));
      map.fitBounds(bounds, { padding: 48, maxZoom: 14 });
    }

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [markers, mapId]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        id={`map-${mapId}`}
        role="application"
        aria-label={ariaLabel}
        tabIndex={0}
        className="w-full rounded-lg border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ height }}
      />
      <OsmAttribution />
    </div>
  );
}
