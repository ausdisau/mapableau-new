import type { StyleSpecification } from "maplibre-gl";

import { getMapAttributionHtml } from "@/lib/map/map-attribution";
import { getMapConfig } from "@/lib/map/map-config";

const DEV_STYLE_URL = "https://demotiles.maplibre.org/style.json";

/** Production raster fallback when no vector style URL is configured. */
function buildRasterFallbackStyle(): StyleSpecification {
  const tileUrl =
    process.env.NEXT_PUBLIC_MAP_TILE_URL ??
    process.env.NEXT_PUBLIC_SELF_HOSTED_TILE_URL;

  if (!tileUrl) {
    return {
      version: 8,
      name: "MapAble Empty",
      sources: {},
      layers: [],
    };
  }

  const attribution = getMapAttributionHtml();

  return {
    version: 8,
    name: "MapAble Raster Fallback",
    sources: {
      "mapable-raster": {
        type: "raster",
        tiles: [tileUrl.includes("{z}") ? tileUrl : `${tileUrl}/{z}/{x}/{y}.png`],
        tileSize: 256,
        attribution,
      },
    },
    layers: [
      {
        id: "mapable-raster-layer",
        type: "raster",
        source: "mapable-raster",
      },
    ],
  };
}

export function resolveMapStyle(): string | StyleSpecification {
  const config = getMapConfig();
  if (config.NEXT_PUBLIC_MAP_STYLE_URL) {
    return config.NEXT_PUBLIC_MAP_STYLE_URL;
  }

  if (process.env.NODE_ENV !== "production") {
    return DEV_STYLE_URL;
  }

  return buildRasterFallbackStyle();
}
