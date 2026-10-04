"use client";

import { Layer, Source } from "react-map-gl/maplibre";
import type { FillLayerSpecification, LineLayerSpecification } from "maplibre-gl";

import type {
  AccessCapitalRegionSlug,
  GccsaBoundaryFeatureCollection,
} from "@/lib/access/regions/gccsa";

const fillLayer: FillLayerSpecification = {
  id: "mapable-access-gccsa-fill",
  type: "fill",
  source: "mapable-access-gccsa",
  paint: {
    "fill-color": "#005B7F",
    "fill-opacity": [
      "case",
      ["==", ["get", "mapableSlug"], ["literal", "__selected__"]],
      0.16,
      0.06,
    ],
  },
};

const lineLayer: LineLayerSpecification = {
  id: "mapable-access-gccsa-line",
  type: "line",
  source: "mapable-access-gccsa",
  paint: {
    "line-color": "#005B7F",
    "line-width": 2,
    "line-opacity": 0.8,
  },
};

export function GccsaBoundaryLayer({
  boundary,
  selectedRegion,
}: {
  boundary: GccsaBoundaryFeatureCollection;
  selectedRegion: "all" | AccessCapitalRegionSlug;
}) {
  const data: GccsaBoundaryFeatureCollection = {
    ...boundary,
    features: boundary.features.map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        mapableSlug:
          selectedRegion !== "all" &&
          feature.properties.mapableSlug === selectedRegion
            ? "__selected__"
            : feature.properties.mapableSlug,
      },
    })),
  };

  return (
    <Source id="mapable-access-gccsa" type="geojson" data={data}>
      <Layer {...fillLayer} />
      <Layer {...lineLayer} />
    </Source>
  );
}
