"use client";

import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import { useCallback } from "react";

import { getDefaultCenter } from "@/lib/map/map-style";

type Props = {
  latitude: number;
  longitude: number;
  onChange: (coords: { latitude: number; longitude: number }) => void;
  disabled?: boolean;
};

export function AccessLocationPicker({
  latitude,
  longitude,
  onChange,
  disabled = false,
}: Props) {
  const defaultCenter = getDefaultCenter();

  const handleMapClick = useCallback(
    (event: { lngLat: { lat: number; lng: number } }) => {
      if (disabled) return;
      onChange({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
    },
    [disabled, onChange]
  );

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Click the map to adjust the pin. The address fields update from your
        selection.
      </p>
      <div
        className="h-[220px] w-full overflow-hidden rounded-lg border border-border"
        role="application"
        aria-label="Map to set place location. Click to move the pin."
      >
        <Map
          initialViewState={{
            latitude: latitude || defaultCenter.lat,
            longitude: longitude || defaultCenter.lng,
            zoom: 14,
          }}
          mapStyle="https://tiles.openfreemap.org/styles/liberty"
          style={{ width: "100%", height: "100%" }}
          attributionControl={{}}
          onClick={handleMapClick}
          cursor={disabled ? "default" : "crosshair"}
        >
          <NavigationControl position="top-left" />
          {Number.isFinite(latitude) && Number.isFinite(longitude) ? (
            <Marker latitude={latitude} longitude={longitude} anchor="bottom">
              <span
                className="block h-3 w-3 rounded-full border-2 border-background bg-primary shadow"
                aria-hidden
              />
            </Marker>
          ) : null}
        </Map>
      </div>
    </div>
  );
}
