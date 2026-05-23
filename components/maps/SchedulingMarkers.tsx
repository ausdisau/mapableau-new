"use client";

import { Marker } from "react-map-gl/maplibre";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  variant?: "pickup" | "dropoff" | "vehicle" | "site";
};

const variantClass: Record<NonNullable<MapMarker["variant"]>, string> = {
  pickup: "bg-emerald-600",
  dropoff: "bg-rose-600",
  vehicle: "bg-blue-600",
  site: "bg-slate-700",
};

export function SchedulingMarkers({ markers }: { markers: MapMarker[] }) {
  return (
    <>
      {markers.map((m) => (
        <Marker key={m.id} longitude={m.lng} latitude={m.lat} anchor="bottom">
          <span
            className={`block rounded px-1.5 py-0.5 text-xs text-white ${variantClass[m.variant ?? "site"]}`}
            title={m.label}
          >
            {m.label}
          </span>
        </Marker>
      ))}
    </>
  );
}
