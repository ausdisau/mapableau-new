"use client";

import { useMemo } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";

export function AccessMapLayer({
  places,
  selectedId,
  onSelect,
}: {
  places: { id: string; name: string; latitude: number; longitude: number }[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  const center = useMemo(() => {
    if (!places.length) return { latitude: -33.8688, longitude: 151.2093 };
    const lat = places.reduce((s, p) => s + p.latitude, 0) / places.length;
    const lng = places.reduce((s, p) => s + p.longitude, 0) / places.length;
    return { latitude: lat, longitude: lng };
  }, [places]);

  return (
    <Map
      initialViewState={{
        latitude: center.latitude,
        longitude: center.longitude,
        zoom: places.length === 1 ? 14 : 10,
      }}
      mapStyle="https://tiles.openfreemap.org/styles/liberty"
      style={{ width: "100%", height: "100%" }}
      attributionControl={{}}
    >
      <NavigationControl position="top-left" />
      {places.map((p) => (
        <Marker
          key={p.id}
          latitude={p.latitude}
          longitude={p.longitude}
          anchor="bottom"
          onClick={(e: { originalEvent: MouseEvent }) => {
            e.originalEvent.stopPropagation();
            onSelect?.(p.id);
          }}
        >
          <button
            type="button"
            aria-label={`${p.name}${selectedId === p.id ? ", selected" : ""}`}
            className={`rounded px-2 py-1 text-xs font-semibold shadow ${
              selectedId === p.id
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground border border-border"
            }`}
          >
            {p.name.slice(0, 24)}
          </button>
        </Marker>
      ))}
    </Map>
  );
}
