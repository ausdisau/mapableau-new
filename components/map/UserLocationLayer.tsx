"use client";

import { Circle, Marker, Popup } from "react-leaflet";
import L from "leaflet";

import type { UserLocation } from "@/types/location";

const userPositionIcon = L.divIcon({
  className: "user-marker-icon",
  html: `<div style="width:20px;height:20px;background:#16a34a;border:2px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

type UserLocationLayerProps = {
  location: UserLocation;
  /** Show accuracy ring when accuracy is known (no animation). */
  showAccuracyCircle?: boolean;
};

/**
 * User location marker for Provider Finder map (Leaflet).
 * MapLibre equivalent can wrap the same props when the map stack migrates.
 */
export function UserLocationLayer({
  location,
  showAccuracyCircle = true,
}: UserLocationLayerProps) {
  const position: [number, number] = [location.latitude, location.longitude];
  const accuracy = location.accuracy;

  return (
    <>
      {showAccuracyCircle && accuracy != null && accuracy > 0 ? (
        <Circle
          center={position}
          radius={Math.min(accuracy, 5000)}
          pathOptions={{
            color: "#16a34a",
            fillColor: "#16a34a",
            fillOpacity: 0.12,
            weight: 1,
          }}
        />
      ) : null}
      <Marker position={position} icon={userPositionIcon}>
        <Popup>Your location (this search only)</Popup>
      </Marker>
    </>
  );
}
