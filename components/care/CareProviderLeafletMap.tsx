"use client";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import {
  CARE_MAP_CENTRES,
  type CareMapBounds,
  type CareMapProvider,
  type CareMapRegion,
} from "@/lib/provider/care-map-contract";

// Use OSM's public tile service only for modest interactive use. Production
// deployments should set a licensed/self-hosted OSM-derived tile service.
const TILE_URL =
  process.env.NEXT_PUBLIC_MAPABLE_CARE_TILE_URL ||
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

type Props = {
  providers: CareMapProvider[];
  region: CareMapRegion;
  selectedId: string | null;
  onBoundsChange: (bounds: CareMapBounds) => void;
  onSelect: (id: string) => void;
};

function readBounds(map: ReturnType<typeof useMap>): CareMapBounds {
  const bounds = map.getBounds();
  return {
    south: Number(bounds.getSouth().toFixed(5)),
    west: Number(bounds.getWest().toFixed(5)),
    north: Number(bounds.getNorth().toFixed(5)),
    east: Number(bounds.getEast().toFixed(5)),
  };
}

function ViewportReporter({
  onBoundsChange,
}: {
  onBoundsChange: Props["onBoundsChange"];
}) {
  const map = useMapEvents({
    moveend: () => onBoundsChange(readBounds(map)),
    zoomend: () => onBoundsChange(readBounds(map)),
  });
  useEffect(() => {
    onBoundsChange(readBounds(map));
  }, [map, onBoundsChange]);
  return null;
}

function FocusRegion({ region }: { region: CareMapRegion }) {
  const map = useMap();
  useEffect(() => {
    map.setView(CARE_MAP_CENTRES[region], region === "ALL" ? 4 : 10, {
      animate: false,
    });
  }, [map, region]);
  return null;
}

function FocusSelected({
  selected,
}: {
  selected: CareMapProvider | undefined;
}) {
  const map = useMap();
  useEffect(() => {
    if (selected) {
      map.panTo([selected.lat, selected.lng], { animate: false });
    }
  }, [map, selected]);
  return null;
}

export default function CareProviderLeafletMap({
  providers,
  region,
  selectedId,
  onBoundsChange,
  onSelect,
}: Props) {
  const selected = providers.find((provider) => provider.id === selectedId);
  return (
    <div
      role="group"
      aria-label="Interactive provider map. The matching text list follows the map."
      className="overflow-hidden rounded-2xl border border-slate-300 bg-slate-100"
    >
      <MapContainer
        center={CARE_MAP_CENTRES.NSW}
        zoom={10}
        minZoom={3}
        maxZoom={18}
        scrollWheelZoom={false}
        keyboard={true}
        style={{ width: "100%", height: "540px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          url={TILE_URL}
        />
        <ViewportReporter onBoundsChange={onBoundsChange} />
        <FocusRegion region={region} />
        <FocusSelected selected={selected} />
        {providers.map((provider) => {
          const active = provider.id === selectedId;
          return (
            <CircleMarker
              key={provider.id}
              center={[provider.lat, provider.lng]}
              radius={active ? 11 : 8}
              pathOptions={{
                color: active ? "#93370D" : "#064D70",
                fillColor: active ? "#EA580C" : "#0E7490",
                fillOpacity: 0.85,
                weight: active ? 4 : 2,
              }}
              eventHandlers={{
                click: () => onSelect(provider.id),
              }}
            >
              <Popup>
                <strong>{provider.name}</strong>
                <p>
                  {provider.suburb || "Location not stated"}{" "}
                  {provider.state || ""}
                </p>
                <p>Imported NDIS directory record. Registration and worker screening require separate checks.</p>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
