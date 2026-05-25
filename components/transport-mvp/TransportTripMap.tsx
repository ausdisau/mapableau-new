"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";

type MapStop = {
  stopType: string;
  address: string;
  lat: number | null;
  lng: number | null;
};

const DEFAULT_STYLE =
  process.env.NEXT_PUBLIC_MAPLIBRE_STYLE_URL ??
  "https://demotiles.maplibre.org/style.json";

export function TransportTripMap({ stops }: { stops: MapStop[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const points = stops.filter((s) => s.lat != null && s.lng != null) as Array<
    MapStop & { lat: number; lng: number }
  >;

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DEFAULT_STYLE,
      center: [points[0].lng, points[0].lat],
      zoom: 12,
      attributionControl: {},
    });
    mapRef.current = map;

    points.forEach((p, i) => {
      new maplibregl.Marker({ color: p.stopType === "pickup" ? "#2563eb" : "#16a34a" })
        .setLngLat([p.lng, p.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 24 }).setHTML(
            `<strong>${p.stopType === "pickup" ? "Pickup" : "Drop-off"}</strong><br/>${p.address}`
          )
        )
        .addTo(map);
    });

    if (points.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      points.forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, { padding: 48, maxZoom: 14 });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [points]);

  if (points.length === 0) {
    return (
      <p className="rounded-lg border p-4 text-sm text-muted-foreground" role="note">
        Map unavailable — location coordinates were not provided for this trip.
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-64 w-full rounded-xl border md:h-80"
      role="img"
      aria-label="Pickup and drop-off map"
    />
  );
}
