"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useId, useRef, useState } from "react";

import { MapAccessibleResultsList } from "@/components/map/MapAccessibleResultsList";
import { MapFullscreenToggle } from "@/components/map/MapFullscreenToggle";
import { useMapConfig } from "@/components/map/MapProvider";
import { installBaseMapLayers } from "@/lib/map/layer-installers";
import { MAP_LAYER_IDS, MAP_SOURCE_IDS } from "@/lib/map/map-layer-ids";
import {
  providersToGeoJSON,
  userLocationToGeoJSON,
} from "@/lib/map/map-feature-query";
import type { MapLayerVisibility } from "@/lib/map/fetch-map-layers";
import {
  setLayerVisibility,
  syncGeoJsonSource,
} from "@/lib/map/use-map-layers";

export type MapLibreProvider = {
  id: string;
  name: string;
  suburb: string;
  state: string;
  lat: number;
  lng: number;
  distanceKm?: number | null;
};

type MapLibreMapProps = {
  providers: MapLibreProvider[];
  center?: { lat: number; lng: number } | null;
  accessGeoJson?: GeoJSON.FeatureCollection | null;
  careGeoJson?: GeoJSON.FeatureCollection | null;
  transportLines?: GeoJSON.FeatureCollection | null;
  transportStops?: GeoJSON.FeatureCollection | null;
  visibility: MapLayerVisibility;
  onProviderSelect?: (id: string) => void;
  selectedProviderId?: string | null;
};

const emptyCollection = (): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: [],
});

export function MapLibreMap({
  providers,
  center,
  accessGeoJson,
  careGeoJson,
  transportLines,
  transportStops,
  visibility,
  onProviderSelect,
  selectedProviderId,
}: MapLibreMapProps) {
  const mapId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onProviderSelectRef = useRef(onProviderSelect);
  onProviderSelectRef.current = onProviderSelect;
  const { styleUrl, attribution, defaultCenter } = useMapConfig();
  const [expanded, setExpanded] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: [defaultCenter.lng, defaultCenter.lat],
      zoom: defaultCenter.zoom,
      attributionControl: {},
    });

    map.addControl(new maplibregl.NavigationControl(), "top-left");
    mapRef.current = map;

    map.on("load", () => {
      installBaseMapLayers(map);
      syncGeoJsonSource(map, MAP_SOURCE_IDS.providers, providersToGeoJSON(providers));
      setMapReady(true);
    });

    map.on("click", MAP_LAYER_IDS.providers, (event) => {
      const feature = event.features?.[0];
      const id = feature?.properties?.id ?? feature?.id;
      if (typeof id === "string") {
        onProviderSelectRef.current?.(id);
      }
    });

    map.on("mouseenter", MAP_LAYER_IDS.providers, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", MAP_LAYER_IDS.providers, () => {
      map.getCanvas().style.cursor = "";
    });

    return () => {
      setMapReady(false);
      map.remove();
      mapRef.current = null;
    };
  }, [styleUrl, defaultCenter.lat, defaultCenter.lng, defaultCenter.zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    syncGeoJsonSource(map, MAP_SOURCE_IDS.providers, providersToGeoJSON(providers));
  }, [providers, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    syncGeoJsonSource(
      map,
      MAP_SOURCE_IDS.accessPlaces,
      accessGeoJson ?? emptyCollection(),
    );
    syncGeoJsonSource(
      map,
      MAP_SOURCE_IDS.careShifts,
      careGeoJson ?? emptyCollection(),
    );
    syncGeoJsonSource(
      map,
      MAP_SOURCE_IDS.transportTrips,
      transportLines ?? emptyCollection(),
    );
    syncGeoJsonSource(
      map,
      MAP_SOURCE_IDS.transportStops,
      transportStops ?? emptyCollection(),
    );

    setLayerVisibility(map, MAP_LAYER_IDS.accessPlaces, visibility.access);
    setLayerVisibility(map, MAP_LAYER_IDS.careShifts, visibility.care);
    setLayerVisibility(map, MAP_LAYER_IDS.transportTrips, visibility.transport);
    setLayerVisibility(map, MAP_LAYER_IDS.pickupPoints, visibility.transport);
  }, [
    accessGeoJson,
    careGeoJson,
    transportLines,
    transportStops,
    visibility.access,
    visibility.care,
    visibility.transport,
    mapReady,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (center) {
      syncGeoJsonSource(
        map,
        MAP_SOURCE_IDS.userLocation,
        userLocationToGeoJSON(center),
      );
      setLayerVisibility(map, MAP_LAYER_IDS.userLocation, true);
      map.flyTo({ center: [center.lng, center.lat], zoom: 12 });
    } else {
      syncGeoJsonSource(map, MAP_SOURCE_IDS.userLocation, emptyCollection());
      setLayerVisibility(map, MAP_LAYER_IDS.userLocation, false);
    }
  }, [center, mapReady]);

  const listResults = providers.slice(0, 50).map((p) => ({
    id: p.id,
    name: p.name,
    subtitle: `${p.suburb}, ${p.state}`,
    distanceLabel:
      p.distanceKm != null ? `${p.distanceKm.toFixed(1)} km away` : undefined,
  }));

  return (
    <div
      className={`relative flex flex-col gap-3 ${expanded ? "fixed inset-0 z-50 bg-background p-4" : ""}`}
    >
      <div
        id={`map-region-${mapId}`}
        ref={containerRef}
        className={`w-full rounded-lg border ${expanded ? "min-h-[70vh] flex-1" : "h-[400px]"}`}
        role="application"
        aria-label="Provider finder map"
      />
      <MapFullscreenToggle
        expanded={expanded}
        onToggle={() => setExpanded((e) => !e)}
        controlsId={`map-region-${mapId}`}
      />
      <p className="text-xs text-muted-foreground">{attribution}</p>
      <MapAccessibleResultsList
        results={listResults}
        selectedId={selectedProviderId}
        onSelect={onProviderSelect}
      />
    </div>
  );
}
