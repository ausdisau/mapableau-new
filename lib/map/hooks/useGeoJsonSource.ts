"use client";

import type maplibregl from "maplibre-gl";
import { useEffect } from "react";

type GeoJsonData = GeoJSON.FeatureCollection | GeoJSON.Feature;

export type MapLayerSpec =
  | {
      layerId: string;
      type: "circle";
      paint?: maplibregl.CircleLayerSpecification["paint"];
    }
  | {
      layerId: string;
      type: "line";
      paint?: maplibregl.LineLayerSpecification["paint"];
      layout?: maplibregl.LineLayerSpecification["layout"];
    }
  | {
      layerId: string;
      type: "fill-extrusion";
      paint?: maplibregl.FillExtrusionLayerSpecification["paint"];
    }
  | {
      layerId: string;
      type: "fill";
      paint?: maplibregl.FillLayerSpecification["paint"];
    };

/**
 * Add or update a GeoJSON source and optional typed layers on a MapLibre map.
 */
export function useMapGeoJsonLayers(
  map: maplibregl.Map | null,
  sourceId: string,
  data: GeoJsonData,
  layers: MapLayerSpec[] = []
) {
  useEffect(() => {
    if (!map) return;

    const apply = () => {
      const existing = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
      if (existing) {
        existing.setData(data);
      } else {
        map.addSource(sourceId, { type: "geojson", data });
      }

      for (const layer of layers) {
        if (map.getLayer(layer.layerId)) continue;
        map.addLayer({
          id: layer.layerId,
          type: layer.type,
          source: sourceId,
          paint: layer.paint,
          layout: "layout" in layer ? layer.layout : undefined,
        });
      }
    };

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once("load", apply);
    }
  }, [map, sourceId, data, layers]);
}

/**
 * Add or update a GeoJSON source on a loaded MapLibre map.
 */
export function useGeoJsonSource(
  map: maplibregl.Map | null,
  sourceId: string,
  data: GeoJSON.FeatureCollection<GeoJSON.Point>,
  layer?: {
    layerId: string;
    paint?: maplibregl.CircleLayerSpecification["paint"];
  }
) {
  useMapGeoJsonLayers(
    map,
    sourceId,
    data,
    layer
      ? [
          {
            layerId: layer.layerId,
            type: "circle",
            paint:
              layer.paint ?? {
                "circle-radius": 8,
                "circle-color": "#2563eb",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffffff",
              },
          },
        ]
      : []
  );
}

type ImageSourceCoordinates = [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
];

/**
 * Add or update a georeferenced image overlay on a MapLibre map.
 */
export function useMapImageSource(
  map: maplibregl.Map | null,
  sourceId: string,
  layerId: string,
  image?: { url: string; coordinates: ImageSourceCoordinates }
) {
  useEffect(() => {
    if (!map || !image) return;

    const apply = () => {
      const existing = map.getSource(sourceId) as
        | maplibregl.ImageSource
        | undefined;

      if (existing) {
        existing.updateImage({ url: image.url, coordinates: image.coordinates });
        return;
      }

      map.addSource(sourceId, {
        type: "image",
        url: image.url,
        coordinates: image.coordinates,
      });

      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: "raster",
          source: sourceId,
          paint: {
            "raster-opacity": 0.85,
          },
        });
      }
    };

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once("load", apply);
    }
  }, [map, sourceId, layerId, image]);
}
