import { geoConfig } from "@/lib/config/geo";

export type MapLibreConfig = {
  enabled: boolean;
  styleUrl: string;
  defaultCenter: [number, number];
  defaultZoom: number;
};

/** MapLibre / OSM-ready defaults for accessible map components. */
export function getMapLibreConfig(): MapLibreConfig {
  return {
    enabled: geoConfig.maplibreEnabled,
    styleUrl: geoConfig.maplibreStyleUrl,
    defaultCenter: [144.9631, -37.8136],
    defaultZoom: 10,
  };
}
