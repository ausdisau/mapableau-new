"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Marker, Popup } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";

import { GaisFeatureDetail } from "@/components/gais/GaisFeatureDetail";
import { useGaisFeaturesInBounds } from "@/hooks/useGaisFeaturesInBounds";
import { isClientGaisLayerEnabled } from "@/lib/gais/client/flags";
import { GAIS_MAP_LAYER_TYPES } from "@/lib/gais/contracts/feature-types";
import type { GaisFeatureType } from "@/lib/gais/contracts/feature-types";
import type { GaisGeoJsonFeature } from "@/lib/gais/geojson/converters";

import { GAIS_MARKER_STYLES } from "./gaisMapSymbols";

export type GaisBounds = {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
};

export function boundsFromMapLibre(map: MapRef): GaisBounds | null {
  const m = map.getMap();
  const b = m.getBounds();
  return {
    minLat: b.getSouth(),
    minLng: b.getWest(),
    maxLat: b.getNorth(),
    maxLng: b.getEast(),
  };
}

function GaisMapLibreMarker({
  feature,
  selected,
  onSelect,
}: {
  feature: GaisGeoJsonFeature;
  selected: boolean;
  onSelect: (id: string | undefined) => void;
}) {
  if (feature.geometry.type !== "Point") return null;
  const [lng, lat] = feature.geometry.coordinates;
  const type = feature.properties.gaisFeatureType as GaisFeatureType;
  const style = GAIS_MARKER_STYLES[type] ?? GAIS_MARKER_STYLES.OTHER;
  const size = selected ? 16 : 12;

  return (
    <Marker latitude={lat} longitude={lng} anchor="center">
      <button
        type="button"
        aria-label={`${feature.properties.name ?? style.label}${selected ? ", selected" : ""}`}
        aria-pressed={selected}
        className="flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/50"
        style={{
          width: size + 8,
          height: size + 8,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(selected ? undefined : feature.id);
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: "block",
            width: size,
            height: size,
            backgroundColor: style.backgroundColor,
            border: `${selected ? 3 : 2}px solid ${style.borderColor}`,
            borderRadius: style.shape === "circle" ? "50%" : style.shape === "square" ? 2 : 0,
            transform: style.shape === "diamond" ? "rotate(45deg)" : undefined,
            clipPath:
              style.shape === "triangle"
                ? "polygon(50% 0%, 0% 100%, 100% 100%)"
                : undefined,
          }}
        />
      </button>
      {selected ? (
        <Popup
          latitude={lat}
          longitude={lng}
          closeButton
          closeOnClick={false}
          onClose={() => onSelect(undefined)}
          maxWidth="320px"
        >
          <GaisFeatureDetail feature={feature} onClose={() => onSelect(undefined)} />
        </Popup>
      ) : null}
    </Marker>
  );
}

export function GaisMapLibreLayer({
  mapRef,
  enabled = isClientGaisLayerEnabled(),
  selectedId,
  onSelect,
  onFeaturesChange,
}: {
  mapRef: React.RefObject<MapRef | null>;
  enabled?: boolean;
  selectedId?: string;
  onSelect?: (id: string | undefined) => void;
  onFeaturesChange?: (features: GaisGeoJsonFeature[]) => void;
}) {
  const [bounds, setBounds] = useState<GaisBounds | null>(null);

  const updateBounds = useCallback(() => {
    if (!mapRef.current) return;
    const next = boundsFromMapLibre(mapRef.current);
    if (next) setBounds(next);
  }, [mapRef]);

  useEffect(() => {
    if (!enabled || !mapRef.current) return;
    const map = mapRef.current.getMap();
    map.on("moveend", updateBounds);
    updateBounds();
    return () => {
      map.off("moveend", updateBounds);
    };
  }, [enabled, mapRef, updateBounds]);

  const { features, loading, error, meta } = useGaisFeaturesInBounds(bounds, enabled);

  useEffect(() => {
    onFeaturesChange?.(features);
  }, [features, onFeaturesChange]);

  const visible = useMemo(
    () =>
      features.filter((f) =>
        GAIS_MAP_LAYER_TYPES.includes(
          f.properties.gaisFeatureType as GaisFeatureType,
        ),
      ),
    [features],
  );

  if (!enabled) return null;

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {loading
          ? "Loading accessibility information layer"
          : `${visible.length} accessibility features in view`}
        {error ? `. ${error}` : ""}
      </p>
      {visible.map((feature) => (
        <GaisMapLibreMarker
          key={feature.id}
          feature={feature}
          selected={selectedId === feature.id}
          onSelect={onSelect ?? (() => undefined)}
        />
      ))}
      {meta ? (
        <p className="sr-only">
          GAIS evidence scope: {meta.evidenceScope}. Not live national routing.
        </p>
      ) : null}
    </>
  );
}
