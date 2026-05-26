"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useId, useRef, useState } from "react";

import { MapAccessibleResultsList } from "@/components/map/MapAccessibleResultsList";
import { MapFullscreenToggle } from "@/components/map/MapFullscreenToggle";
import { useMapConfig } from "@/components/map/MapProvider";
import { MAP_LAYER_IDS } from "@/lib/map/map-layer-ids";
import { providersToGeoJSON } from "@/lib/map/map-feature-query";

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
  userPosition?: { lat: number; lng: number } | null;
  onProviderSelect?: (id: string) => void;
  selectedProviderId?: string | null;
};

export function MapLibreMap({
  providers,
  userPosition,
  onProviderSelect,
  selectedProviderId,
}: MapLibreMapProps) {
  const mapId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const { styleUrl, attribution, defaultCenter } = useMapConfig();
  const [expanded, setExpanded] = useState(false);

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
      const geo = providersToGeoJSON(providers);
      map.addSource("providers", {
        type: "geojson",
        data: geo,
      });
      map.addLayer({
        id: MAP_LAYER_IDS.providers,
        type: "circle",
        source: "providers",
        paint: {
          "circle-radius": 8,
          "circle-color": "#2563eb",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [styleUrl, defaultCenter.lat, defaultCenter.lng, defaultCenter.zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const source = map.getSource("providers") as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(providersToGeoJSON(providers));
    }
  }, [providers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPosition) return;
    map.flyTo({ center: [userPosition.lng, userPosition.lat], zoom: 12 });
  }, [userPosition]);

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
