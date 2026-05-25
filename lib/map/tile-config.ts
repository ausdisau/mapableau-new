import type { TileLayerProps } from "react-leaflet";

export type MapTileProviderId = "osm_public" | "osm_commercial" | "self_hosted";

export interface MapTileProviderConfig {
  id: MapTileProviderId;
  url: string;
  attribution: string;
  /** Public OSM tiles are not suitable for heavy commercial traffic. */
  commercialUseAllowed: boolean;
}

const TILE_PROVIDERS: Record<MapTileProviderId, MapTileProviderConfig> = {
  osm_public: {
    id: "osm_public",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    commercialUseAllowed: false,
  },
  osm_commercial: {
    id: "osm_commercial",
    url:
      process.env.NEXT_PUBLIC_MAP_TILE_URL ??
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ??
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    commercialUseAllowed: true,
  },
  self_hosted: {
    id: "self_hosted",
    url:
      process.env.NEXT_PUBLIC_SELF_HOSTED_TILE_URL ??
      "/api/map/tiles/{z}/{x}/{y}.png",
    attribution:
      process.env.NEXT_PUBLIC_SELF_HOSTED_TILE_ATTRIBUTION ??
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    commercialUseAllowed: true,
  },
};

export function resolveMapTileProvider(): MapTileProviderConfig {
  const configured = process.env.NEXT_PUBLIC_MAP_TILE_PROVIDER as
    | MapTileProviderId
    | undefined;

  if (configured && TILE_PROVIDERS[configured]) {
    return TILE_PROVIDERS[configured];
  }

  if (process.env.NODE_ENV === "production") {
    return TILE_PROVIDERS.osm_commercial;
  }

  return TILE_PROVIDERS.osm_public;
}

export function getTileLayerProps(): Pick<TileLayerProps, "url" | "attribution"> {
  const provider = resolveMapTileProvider();
  return {
    url: provider.url,
    attribution: provider.attribution,
  };
}
