"use client";

import { latLngBounds } from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { openStreetMapConfig } from "@/lib/config/openstreetmap";
import { mapMarkerIcons } from "@/lib/map/leaflet-markers";
import "@/lib/map/leaflet-icons";

export type AccessibleMapPoint = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  kind: "pickup" | "dropoff" | "alert";
};

function FitBounds({ points }: { points: AccessibleMapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14);
      return;
    }
    const bounds = latLngBounds(
      points.map((p) => [p.lat, p.lng] as [number, number])
    );
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
  }, [map, points]);
  return null;
}

export function AccessibleOsmMapInner({
  points,
  announcement,
}: {
  points: AccessibleMapPoint[];
  announcement: string;
}) {
  const center: [number, number] = points[0]
    ? [points[0].lat, points[0].lng]
    : [-33.8688, 151.2093];

  return (
    <div className="relative h-full min-h-[280px] w-full overflow-hidden rounded-[var(--tb-radius)] border border-[var(--tb-border-subtle)]">
      <MapContainer
        center={center}
        zoom={12}
        className="h-full min-h-[280px] w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution={openStreetMapConfig.attribution}
          url={openStreetMapConfig.tileUrlTemplate}
        />
        <FitBounds points={points} />
        {points.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={
              p.kind === "alert"
                ? mapMarkerIcons.selected
                : mapMarkerIcons.provider
            }
          >
            <Popup>{p.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
