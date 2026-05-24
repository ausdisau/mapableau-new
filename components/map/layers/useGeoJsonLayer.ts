"use client";

import type {
  CircleLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from "maplibre-gl";
import { useEffect, useMemo } from "react";

import { useMapLibre } from "@/components/map/MapProvider";
import { upsertGeoJsonSource, upsertLayer } from "@/lib/map/map-sources";

type LayerSpec =
  | CircleLayerSpecification
  | SymbolLayerSpecification
  | LineLayerSpecification
  | FillLayerSpecification;

export function useGeoJsonLayer(params: {
  sourceId: string;
  data: GeoJSON.FeatureCollection;
  layers: LayerSpec[];
  enabled?: boolean;
}) {
  const { map, isReady } = useMapLibre();
  const layerKey = useMemo(
    () => params.layers.map((layer) => layer.id).join("|"),
    [params.layers],
  );

  useEffect(() => {
    if (!map || !isReady || params.enabled === false) return;

    upsertGeoJsonSource(map, params.sourceId, params.data);
    for (const layer of params.layers) {
      upsertLayer(map, layer);
    }
  }, [isReady, map, params.sourceId, params.data, params.enabled, layerKey, params.layers]);
}
