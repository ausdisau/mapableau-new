"use client";

import { latLngBounds } from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { mapMarkerIcons } from "@/lib/map/leaflet-markers";

type Point = {
  latitude: number;
  longitude: number;
  label: string;
};

function FitBounds({ points }: { points: Point[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 15);
      return;
    }
    const bounds = latLngBounds(
      points.map((p) => [p.latitude, p.longitude] as [number, number])
    );
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 16 });
  }, [map, points]);
  return null;
}

export default function PaceTelemetryMap({
  checkIn,
  checkOut,
}: {
  checkIn: Point | null;
  checkOut: Point | null;
}) {
  const points = [checkIn, checkOut].filter((p): p is Point => Boolean(p));
  if (points.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No GPS telemetry markers available yet.
      </p>
    );
  }

  const center: [number, number] = [
    points[0].latitude,
    points[0].longitude,
  ];

  return (
    <div
      className="overflow-hidden rounded-xl border border-border"
      style={{ height: 280, width: "100%" }}
      role="img"
      aria-label="Shift telemetry map showing worker check-in and check-out locations"
    >
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {checkIn ? (
          <Marker
            position={[checkIn.latitude, checkIn.longitude]}
            icon={mapMarkerIcons.provider}
          >
            <Popup>{checkIn.label}</Popup>
          </Marker>
        ) : null}
        {checkOut ? (
          <Marker
            position={[checkOut.latitude, checkOut.longitude]}
            icon={mapMarkerIcons.selected}
          >
            <Popup>{checkOut.label}</Popup>
          </Marker>
        ) : null}
      </MapContainer>
    </div>
  );
}
