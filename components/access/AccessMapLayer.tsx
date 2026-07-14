"use client";

import { useMemo } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";

import { useMapConfig } from "@/components/map/MapProvider";

export type AccessMapMarkerPlace = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  ariaLabel?: string;
};

export function AccessMapLayer({
  places,
  selectedId,
  onSelect,
}: {
  places: AccessMapMarkerPlace[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  const { styleUrl, attribution, defaultCenter } = useMapConfig();

  const center = useMemo(() => {
    if (!places.length) {
      return {
        latitude: defaultCenter.lat,
        longitude: defaultCenter.lng,
      };
    }
    const lat = places.reduce((s, p) => s + p.latitude, 0) / places.length;
    const lng = places.reduce((s, p) => s + p.longitude, 0) / places.length;
    return { latitude: lat, longitude: lng };
  }, [places, defaultCenter.lat, defaultCenter.lng]);

  return (
    <Map
      initialViewState={{
        latitude: center.latitude,
        longitude: center.longitude,
        zoom: places.length === 1 ? 14 : defaultCenter.zoom,
      }}
      mapStyle={styleUrl}
      style={{ width: "100%", height: "100%" }}
      attributionControl={{}}
    >
      <NavigationControl position="top-left" />
      {places.map((p) => {
        const selected = selectedId === p.id;
        const label =
          p.ariaLabel ??
          `${p.name}${selected ? ", selected" : ""}. Press Enter to open details.`;
        return (
          <Marker
            key={p.id}
            latitude={p.latitude}
            longitude={p.longitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onSelect?.(p.id);
            }}
          >
            <button
              type="button"
              aria-label={label}
              aria-pressed={selected}
              className={`min-h-12 rounded-lg px-3 py-2 text-sm font-semibold shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#005B7F] ${
                selected
                  ? "bg-[#005B7F] text-white"
                  : "border border-border bg-background text-foreground"
              }`}
            >
              {p.name.slice(0, 24)}
            </button>
          </Marker>
        );
      })}
      <p className="sr-only">{attribution}</p>
    </Map>
  );
}
