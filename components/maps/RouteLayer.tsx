"use client";

import { Layer, Source } from "react-map-gl/maplibre";

type RouteLayerProps = {
  geometry: GeoJSON.LineString | null;
};

export function RouteLayer({ geometry }: RouteLayerProps) {
  if (!geometry) return null;

  const data: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry,
      },
    ],
  };

  return (
    <Source id="route" type="geojson" data={data}>
      <Layer
        id="route-line"
        type="line"
        paint={{
          "line-color": "#2563eb",
          "line-width": 4,
        }}
      />
    </Source>
  );
}
