"use client";

import L from "leaflet";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Marker, Popup, useMap, useMapEvents } from "react-leaflet";

import { GaisFeatureDetail } from "@/components/gais/GaisFeatureDetail";
import { gaisMarkerHtml } from "@/components/gais/gaisMapSymbols";
import { useGaisFeaturesInBounds } from "@/hooks/useGaisFeaturesInBounds";
import { isClientGaisLayerEnabled } from "@/lib/gais/client/flags";
import { GAIS_MAP_LAYER_TYPES } from "@/lib/gais/contracts/feature-types";
import type { GaisFeatureType } from "@/lib/gais/contracts/feature-types";
import type { GaisGeoJsonFeature } from "@/lib/gais/geojson/converters";

export type GaisBounds = {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
};

function boundsFromLeafletMap(map: L.Map): GaisBounds {
  const b = map.getBounds();
  return {
    minLat: b.getSouth(),
    minLng: b.getWest(),
    maxLat: b.getNorth(),
    maxLng: b.getEast(),
  };
}

function GaisBoundsTracker({
  onBoundsChange,
}: {
  onBoundsChange: (bounds: GaisBounds) => void;
}) {
  const map = useMap();

  useMapEvents({
    moveend: () => onBoundsChange(boundsFromLeafletMap(map)),
    zoomend: () => onBoundsChange(boundsFromLeafletMap(map)),
  });

  useEffect(() => {
    onBoundsChange(boundsFromLeafletMap(map));
  }, [map, onBoundsChange]);

  return null;
}

function createGaisIcon(type: GaisFeatureType, selected: boolean) {
  return L.divIcon({
    className: "",
    html: gaisMarkerHtml(type, selected),
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export function GaisLeafletLayer({
  enabled = isClientGaisLayerEnabled(),
  selectedId,
  onSelect,
  onFeaturesChange,
}: {
  enabled?: boolean;
  selectedId?: string;
  onSelect?: (id: string | undefined) => void;
  onFeaturesChange?: (features: GaisGeoJsonFeature[]) => void;
}) {
  const [bounds, setBounds] = useState<GaisBounds | null>(null);
  const handleBounds = useCallback((b: GaisBounds) => setBounds(b), []);
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
      <GaisBoundsTracker onBoundsChange={handleBounds} />
      <p className="sr-only" aria-live="polite">
        {loading
          ? "Loading accessibility information layer"
          : `${visible.length} accessibility features in view`}
        {error ? `. ${error}` : ""}
      </p>
      {visible.map((feature) => {
        if (feature.geometry.type !== "Point") return null;
        const [lng, lat] = feature.geometry.coordinates;
        const type = feature.properties.gaisFeatureType as GaisFeatureType;
        return (
          <Marker
            key={feature.id}
            position={[lat, lng]}
            icon={createGaisIcon(type, selectedId === feature.id)}
            eventHandlers={{
              click: () => onSelect?.(selectedId === feature.id ? undefined : feature.id),
            }}
          >
            <Popup closeButton autoPan maxWidth={340} minWidth={240}>
              <GaisFeatureDetail
                feature={feature}
                onClose={() => onSelect?.(undefined)}
              />
            </Popup>
          </Marker>
        );
      })}
      {meta ? (
        <p className="sr-only">
          GAIS evidence scope: {meta.evidenceScope}. Not live national routing.
        </p>
      ) : null}
    </>
  );
}
