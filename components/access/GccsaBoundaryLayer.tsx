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
    "fill-opacity": 0.05,
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
  const selectedFill: FillLayerSpecification = {
    id: "mapable-access-gccsa-selected-fill",
    type: "fill",
    source: "mapable-access-gccsa",
    filter: [
      "==",
      ["get", "mapableSlug"],
      selectedRegion === "all" ? "__none__" : selectedRegion,
    ],
    paint: {
      "fill-color": "#005B7F",
      "fill-opacity": 0.18,
    },
  };

  return (
    <Source
      id="mapable-access-gccsa"
      type="geojson"
      data={boundary as never}
    >
      <Layer {...fillLayer} />
      <Layer {...selectedFill} />
      <Layer {...lineLayer} />
    </Source>
  );
}
