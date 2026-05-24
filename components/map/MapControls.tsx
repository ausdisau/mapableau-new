"use client";

import type { Map as MapLibreMapInstance } from "maplibre-gl";

interface MapControlsProps {
  map: MapLibreMapInstance | null;
}

export function MapControls({ map }: MapControlsProps) {
  if (!map) return null;
  return null;
}

/** Navigation controls are added directly in MapLibreMap via maplibregl.NavigationControl. */
