"use client";

import type { Map as MapLibreMapInstance } from "maplibre-gl";
import { createContext, useContext, type ReactNode } from "react";

import type { MapFeatureSelection } from "@/lib/map/map-feature-query";

export interface MapContextValue {
  map: MapLibreMapInstance | null;
  isReady: boolean;
  selectedFeature: MapFeatureSelection | null;
  setSelectedFeature: (feature: MapFeatureSelection | null) => void;
}

export const MapContext = createContext<MapContextValue>({
  map: null,
  isReady: false,
  selectedFeature: null,
  setSelectedFeature: () => undefined,
});

export function MapProvider({
  value,
  children,
}: {
  value: MapContextValue;
  children: ReactNode;
}) {
  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMapLibre() {
  return useContext(MapContext);
}
