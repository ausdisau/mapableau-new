"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import maplibregl from "maplibre-gl";
import { useEffect, useMemo, useRef } from "react";

import { MAPABLE_DEFAULT_MAP_STYLE } from "@/lib/geo/maplibre";

export type AccessibleMapPoint = {
  id: string;
  label: string;
  address: string;
  lat: number | null;
  lng: number | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function AccessibleMap({ points }: { points: AccessibleMapPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const validPoints = useMemo(
    () =>
      points.filter((point) => point.lat != null && point.lng != null) as Array<
        AccessibleMapPoint & { lat: number; lng: number }
      >,
    [points],
  );

  useEffect(() => {
    if (!containerRef.current || validPoints.length === 0) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAPABLE_DEFAULT_MAP_STYLE,
      center: [validPoints[0].lng, validPoints[0].lat],
      zoom: 12,
      attributionControl: {},
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    validPoints.forEach((point, index) => {
      new maplibregl.Marker({ color: index === 0 ? "#2563eb" : "#16a34a" })
        .setLngLat([point.lng, point.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 24 }).setHTML(
            `<strong>${escapeHtml(point.label)}</strong><br/>${escapeHtml(point.address)}`,
          ),
        )
        .addTo(map);
    });

    if (validPoints.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      validPoints.forEach((point) => bounds.extend([point.lng, point.lat]));
      map.fitBounds(bounds, { padding: 48, maxZoom: 14 });
    }

    return () => map.remove();
  }, [validPoints]);

  return (
    <section className="space-y-3">
      {validPoints.length ? (
        <div
          ref={containerRef}
          className="h-64 w-full rounded-xl border md:h-80"
          role="img"
          aria-label="Map showing trip stops"
        />
      ) : (
        <p className="rounded-lg border p-4 text-sm" role="note">
          Map unavailable because coordinates are not available yet.
        </p>
      )}
      <ol className="space-y-2" aria-label="Trip stop list">
        {points.map((point) => (
          <li key={point.id} className="rounded-lg border p-3 text-sm">
            <span className="font-medium">{point.label}:</span> {point.address}
          </li>
        ))}
      </ol>
    </section>
  );
}
