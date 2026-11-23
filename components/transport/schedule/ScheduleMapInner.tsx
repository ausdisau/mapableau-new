"use client";

import { latLngBounds } from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { openStreetMapConfig } from "@/lib/config/openstreetmap";
import { mapMarkerIcons } from "@/lib/map/leaflet-markers";
import "@/lib/map/leaflet-icons";

type Point = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  href: string;
};

function FitBounds({ points }: { points: Point[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 13);
      return;
    }
    const bounds = latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14 });
  }, [map, points]);
  return null;
}

/** Client-only Leaflet 1.9.x map for schedule pins (privacy-masked coordinates). */
export function ScheduleMapInner({ points }: { points: Point[] }) {
  const center: [number, number] = points[0]
    ? [points[0].lat, points[0].lng]
    : [-33.8688, 151.2093];

  return (
    <div
      className="h-80 w-full overflow-hidden rounded border border-border"
      role="region"
      aria-label="Schedule map of disclosable trip locations"
    >
      <MapContainer
        center={center}
        zoom={11}
        className="h-full w-full"
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
            icon={mapMarkerIcons.provider}
          >
            <Popup>
              <a href={p.href}>{p.label}</a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <p className="sr-only">
        Map markers duplicate the trip table. Prefer the table for keyboard and
        screen-reader navigation.
      </p>
    </div>
  );
}
