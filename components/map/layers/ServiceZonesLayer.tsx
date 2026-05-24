"use client";

import { useMemo } from "react";

import { useGeoJsonLayer } from "@/components/map/layers/useGeoJsonLayer";
import { MAP_LAYERS, MAP_SOURCES } from "@/lib/map/map-layer-ids";
import { emptyFeatureCollection } from "@/lib/map/map-sources";

export interface ServiceZoneFeature {
  id: string;
  polygon: GeoJSON.Polygon;
  name: string;
}

type ServiceZonesLayerProps = {
  zones: ServiceZoneFeature[];
};

export function ServiceZonesLayer({ zones }: ServiceZonesLayerProps) {
  const data = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: zones.map((zone) => ({
        type: "Feature",
        id: zone.id,
        geometry: zone.polygon,
        properties: { id: zone.id, name: zone.name },
      })),
    }),
    [zones],
  );

  useGeoJsonLayer({
    sourceId: MAP_SOURCES.serviceZones,
    data: data.features.length > 0 ? data : emptyFeatureCollection(),
    layers: [
      {
        id: MAP_LAYERS.serviceZonesFill,
        type: "fill",
        source: MAP_SOURCES.serviceZones,
        paint: {
          "fill-color": "#2563eb",
          "fill-opacity": 0.15,
        },
      },
      {
        id: MAP_LAYERS.serviceZonesOutline,
        type: "line",
        source: MAP_SOURCES.serviceZones,
        paint: {
          "line-color": "#2563eb",
          "line-width": 2,
        },
      },
    ],
  });

  return null;
}
