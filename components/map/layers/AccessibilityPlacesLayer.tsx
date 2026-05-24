"use client";

import { useMemo } from "react";

import { useGeoJsonLayer } from "@/components/map/layers/useGeoJsonLayer";
import { MAP_LAYERS, MAP_SOURCES } from "@/lib/map/map-layer-ids";
import { emptyFeatureCollection } from "@/lib/map/map-sources";

export interface AccessibilityPlaceFeature {
  id: string;
  lng: number;
  lat: number;
  name: string;
  confidence: string;
}

type AccessibilityPlacesLayerProps = {
  places: AccessibilityPlaceFeature[];
};

export function AccessibilityPlacesLayer({ places }: AccessibilityPlacesLayerProps) {
  const data = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: places.map((place) => ({
        type: "Feature",
        id: place.id,
        geometry: { type: "Point", coordinates: [place.lng, place.lat] },
        properties: {
          id: place.id,
          name: place.name,
          confidence: place.confidence,
        },
      })),
    }),
    [places],
  );

  useGeoJsonLayer({
    sourceId: MAP_SOURCES.accessibilityPlaces,
    data: data.features.length > 0 ? data : emptyFeatureCollection(),
    layers: [
      {
        id: MAP_LAYERS.accessibilityPlaces,
        type: "circle",
        source: MAP_SOURCES.accessibilityPlaces,
        paint: {
          "circle-radius": 7,
          "circle-color": "#0891b2",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      },
    ],
  });

  return null;
}
