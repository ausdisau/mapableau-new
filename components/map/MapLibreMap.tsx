"use client";

import maplibregl, { type LngLatBoundsLike } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { MapProvider } from "@/components/map/MapProvider";
import { getMapAttributionHtml } from "@/lib/map/map-attribution";
import { getDefaultCenter, getDefaultZoom } from "@/lib/map/map-config";
import { bindFeatureClickHandler, type MapFeatureSelection } from "@/lib/map/map-feature-query";
import { resolveMapStyle } from "@/lib/map/map-style";

export type MapLibreMapProps = {
  center?: [number, number];
  zoom?: number;
  bounds?: LngLatBoundsLike;
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
  onMapReady?: (map: maplibregl.Map) => void;
  onFeatureSelect?: (selection: MapFeatureSelection) => void;
  cooperativeGestures?: boolean;
};

export function MapLibreMap({
  center,
  zoom,
  bounds,
  className,
  style,
  children,
  onMapReady,
  onFeatureSelect,
  cooperativeGestures = false,
}: MapLibreMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<MapFeatureSelection | null>(null);

  const initialCenter = useMemo(() => center ?? getDefaultCenter(), [center]);
  const initialZoom = zoom ?? getDefaultZoom();
  const mapStyle = useMemo(() => resolveMapStyle(), []);

  const handleFeatureSelect = useCallback(
    (selection: MapFeatureSelection) => {
      setSelectedFeature(selection);
      onFeatureSelect?.(selection);
    },
    [onFeatureSelect],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: mapStyle,
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: false,
        pitchWithRotate: false,
        dragRotate: false,
        touchPitch: false,
        cooperativeGestures,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
      map.addControl(
        new maplibregl.AttributionControl({ compact: true, customAttribution: getMapAttributionHtml() }),
        "bottom-right",
      );

      mapRef.current = map;
      setMapInstance(map);

      map.on("load", () => {
        setIsReady(true);
        onMapReady?.(map);
      });

      map.on("error", (event) => {
        const message =
          event.error?.message ?? "Map failed to load. Check style URL configuration.";
        setError(message);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not initialise map");
      return;
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      setMapInstance(null);
      setIsReady(false);
    };
  }, [cooperativeGestures, initialCenter, initialZoom, mapStyle, onMapReady]);

  useEffect(() => {
    if (!mapInstance || !isReady) return;
    return bindFeatureClickHandler(mapInstance, handleFeatureSelect);
  }, [handleFeatureSelect, isReady, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !isReady || !bounds) return;
    mapInstance.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: prefersReducedMotion() ? 0 : 500 });
  }, [bounds, isReady, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !isReady || !center) return;
    mapInstance.flyTo({
      center,
      zoom: zoom ?? mapInstance.getZoom(),
      duration: prefersReducedMotion() ? 0 : 500,
    });
  }, [center, isReady, mapInstance, zoom]);

  const contextValue = useMemo(
    () => ({
      map: mapInstance,
      isReady,
      selectedFeature,
      setSelectedFeature,
    }),
    [isReady, mapInstance, selectedFeature],
  );

  return (
    <MapProvider value={contextValue}>
      <div
        className={className ?? "relative h-[500px] w-full overflow-hidden rounded-xl"}
        style={style}
      >
        {!isReady && !error ? (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-muted/40 text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            Loading map…
          </div>
        ) : null}
        {error ? (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-destructive/5 p-4 text-center text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        ) : null}
        <div ref={containerRef} className="h-full w-full" aria-label="Interactive map" />
        {isReady ? children : null}
      </div>
    </MapProvider>
  );
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
