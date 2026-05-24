"use client";

import { useMemo } from "react";

import { useGeoJsonLayer } from "@/components/map/layers/useGeoJsonLayer";
import { getMapConfig } from "@/lib/map/map-config";
import { MAP_LAYERS, MAP_SOURCES } from "@/lib/map/map-layer-ids";
import { emptyFeatureCollection } from "@/lib/map/map-sources";

export interface DispatchVehicleFeature {
  id: string;
  lng: number;
  lat: number;
  label: string;
}

type DispatchVehiclesLayerProps = {
  vehicles: DispatchVehicleFeature[];
  canView: boolean;
};

export function DispatchVehiclesLayer({ vehicles, canView }: DispatchVehiclesLayerProps) {
  const dispatchEnabled = getMapConfig().MAP_ENABLE_DISPATCH_LAYER === true;
  const enabled = canView && dispatchEnabled;

  const data = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: vehicles.map((vehicle) => ({
        type: "Feature",
        id: vehicle.id,
        geometry: { type: "Point", coordinates: [vehicle.lng, vehicle.lat] },
        properties: {
          id: vehicle.id,
          label: vehicle.label,
        },
      })),
    }),
    [vehicles],
  );

  useGeoJsonLayer({
    sourceId: MAP_SOURCES.dispatchVehicles,
    data: enabled && data.features.length > 0 ? data : emptyFeatureCollection(),
    enabled,
    layers: [
      {
        id: MAP_LAYERS.dispatchVehicles,
        type: "symbol",
        source: MAP_SOURCES.dispatchVehicles,
        layout: {
          "text-field": "🚐",
          "text-size": 18,
        },
      },
    ],
  });

  return null;
}
