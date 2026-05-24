"use client";

import { useMemo } from "react";

import { useGeoJsonLayer } from "@/components/map/layers/useGeoJsonLayer";
import { MAP_LAYERS, MAP_SOURCES } from "@/lib/map/map-layer-ids";
import { emptyFeatureCollection } from "@/lib/map/map-sources";

type UserLocationLayerProps = {
  position: { lat: number; lng: number } | null;
};

export function UserLocationLayer({ position }: UserLocationLayerProps) {
  const data = useMemo<GeoJSON.FeatureCollection>(() => {
    if (!position) return emptyFeatureCollection();
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "user-location",
          geometry: {
            type: "Point",
            coordinates: [position.lng, position.lat],
          },
          properties: { id: "user-location", label: "You are here" },
        },
      ],
    };
  }, [position]);

  useGeoJsonLayer({
    sourceId: MAP_SOURCES.userLocation,
    data,
    enabled: Boolean(position),
    layers: [
      {
        id: MAP_LAYERS.userLocation,
        type: "circle",
        source: MAP_SOURCES.userLocation,
        paint: {
          "circle-radius": 9,
          "circle-color": "#16a34a",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      },
    ],
  });

  return null;
}
