"use client";

import { useEffect, useMemo, useState } from "react";
import type maplibregl from "maplibre-gl";
import Map, { NavigationControl } from "react-map-gl/maplibre";

import { useMapConfig } from "@/components/map/MapProvider";
import type { IndoorBuildingView, IndoorRouteView } from "@/lib/access-indoor/types";
import { INDOOR_POI_LABELS } from "@/lib/access-indoor/types";
import { ACCESS_DISCLAIMER } from "@/lib/access-map/copy";
import {
  filterPoisByAccessibility,
} from "@/lib/map/indoor/indoor-map-mappers";
import {
  BUILDING_3D_LAYER_IDS,
  BUILDING_3D_SOURCE_IDS,
  buildBuilding3DLayers,
} from "@/lib/map/indoor/building-3d-layers";
import {
  useMapGeoJsonLayers,
  useMapImageSource,
} from "@/lib/map/hooks/useGeoJsonSource";

const SHELL_LAYER = [
  {
    layerId: BUILDING_3D_LAYER_IDS.shell,
    type: "fill-extrusion" as const,
    paint: {
      "fill-extrusion-color": "#94a3b8",
      "fill-extrusion-height": ["get", "height"],
      "fill-extrusion-base": ["get", "base"],
      "fill-extrusion-opacity": 0.35,
    },
  },
];

const FLOOR_SLICE_LAYER = [
  {
    layerId: BUILDING_3D_LAYER_IDS.floorSlices,
    type: "fill-extrusion" as const,
    paint: {
      "fill-extrusion-color": [
        "case",
        ["get", "selected"],
        "#005B7F",
        "#64748b",
      ],
      "fill-extrusion-height": ["+", ["get", "base"], ["get", "height"]],
      "fill-extrusion-base": ["get", "base"],
      "fill-extrusion-opacity": ["get", "opacity"],
    },
  },
];

const POI_LAYER = [
  {
    layerId: BUILDING_3D_LAYER_IDS.pois,
    type: "circle" as const,
    paint: {
      "circle-radius": 7,
      "circle-color": "#005B7F",
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
    },
  },
];

const ROUTE_LAYER = [
  {
    layerId: BUILDING_3D_LAYER_IDS.route,
    type: "line" as const,
    paint: {
      "line-color": "#005B7F",
      "line-width": 4,
    },
    layout: {
      "line-cap": "round" as const,
      "line-join": "round" as const,
    },
  },
];

function Building3DMapLayers({
  map,
  building,
  selectedFloorId,
  route,
}: {
  map: maplibregl.Map | null;
  building: IndoorBuildingView;
  selectedFloorId: string;
  route: IndoorRouteView | null;
}) {
  const layers = useMemo(
    () =>
      buildBuilding3DLayers({
        building,
        selectedFloorId,
        route,
      }),
    [building, selectedFloorId, route]
  );

  useMapGeoJsonLayers(map, BUILDING_3D_SOURCE_IDS.shell, layers.shell, SHELL_LAYER);
  useMapGeoJsonLayers(
    map,
    BUILDING_3D_SOURCE_IDS.floorSlices,
    layers.floorSlices,
    FLOOR_SLICE_LAYER
  );
  useMapGeoJsonLayers(map, BUILDING_3D_SOURCE_IDS.pois, layers.pois, POI_LAYER);
  useMapGeoJsonLayers(map, BUILDING_3D_SOURCE_IDS.route, layers.route, ROUTE_LAYER);
  useMapImageSource(
    map,
    BUILDING_3D_SOURCE_IDS.floorImage,
    BUILDING_3D_LAYER_IDS.floorImage,
    layers.floorImage
  );

  useEffect(() => {
    if (!map || !layers.mapBounds) return;

    map.fitBounds(layers.mapBounds, {
      padding: 48,
      pitch: 60,
      bearing: -25,
      duration: 0,
    });
  }, [map, layers.mapBounds, selectedFloorId]);

  return null;
}

function FloorSelector({
  floors,
  selectedFloorId,
  onSelect,
}: {
  floors: IndoorBuildingView["floors"];
  selectedFloorId: string;
  onSelect: (floorId: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Floor selector">
      {floors.map((floor) => (
        <button
          key={floor.id}
          type="button"
          role="tab"
          aria-selected={selectedFloorId === floor.id}
          className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${
            selectedFloorId === floor.id
              ? "bg-[#005B7F] text-white"
              : "border border-slate-200 bg-white text-[#0C1833]"
          }`}
          onClick={() => onSelect(floor.id)}
        >
          {floor.label}
        </button>
      ))}
    </div>
  );
}

export function AccessBuilding3DMapLayer({
  placeId,
  building,
}: {
  placeId: string;
  building: IndoorBuildingView;
}) {
  const { styleUrl, attribution } = useMapConfig();
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState(building.floors[0]?.id ?? "");
  const [accessibleOnly, setAccessibleOnly] = useState(true);
  const [fromPoiId, setFromPoiId] = useState<string | undefined>();
  const [toPoiId, setToPoiId] = useState<string | undefined>();
  const [route, setRoute] = useState<IndoorRouteView | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const floor =
    building.floors.find((f) => f.id === selectedFloorId) ?? building.floors[0];

  const layerBundle = useMemo(
    () =>
      buildBuilding3DLayers({
        building,
        selectedFloorId: floor?.id ?? selectedFloorId,
        route,
      }),
    [building, floor?.id, selectedFloorId, route]
  );

  async function findRoute() {
    if (!fromPoiId || !toPoiId) {
      setRouteError("Select a start and destination point.");
      return;
    }

    setRouteError(null);
    const params = new URLSearchParams({
      from: fromPoiId,
      to: toPoiId,
      wheelchair: "true",
      avoidStairs: "true",
    });
    const res = await fetch(
      `/api/access/places/${placeId}/indoor/wayfinding?${params}`
    );
    if (!res.ok) {
      setRoute(null);
      setRouteError("No accessible route found between those points.");
      return;
    }
    const data = (await res.json()) as { route: IndoorRouteView };
    setRoute(data.route);
    const firstSegment = data.route.segments[0];
    if (firstSegment) setSelectedFloorId(firstSegment.floorId);
  }

  function handlePoiSelect(poiId: string) {
    if (!fromPoiId || (fromPoiId && toPoiId)) {
      setFromPoiId(poiId);
      setToPoiId(undefined);
      setRoute(null);
      return;
    }
    setToPoiId(poiId);
  }

  if (!floor) return null;

  const visiblePois = filterPoisByAccessibility(floor.pois, accessibleOnly);

  return (
    <section className="space-y-4" aria-label="3D building map">
      <div>
        <h2 className="text-lg font-semibold">3D building map</h2>
        <p className="text-sm text-muted-foreground">
          {building.name}. Explore floor slices in 3D, then select two points for
          an accessible route. {ACCESS_DISCLAIMER}
        </p>
      </div>

      <FloorSelector
        floors={building.floors}
        selectedFloorId={floor.id}
        onSelect={setSelectedFloorId}
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={accessibleOnly}
          onChange={(e) => setAccessibleOnly(e.target.checked)}
        />
        Highlight step-free amenities (lift, ramp, accessible toilet)
      </label>

      <div
        className="h-[min(50vh,420px)] w-full overflow-hidden rounded-lg border border-border"
        role="application"
        aria-label="3D map of building floors and accessible points"
      >
        <Map
          initialViewState={{
            longitude: layerBundle.mapCenter.lng,
            latitude: layerBundle.mapCenter.lat,
            zoom: 18,
            pitch: 60,
            bearing: -25,
          }}
          mapStyle={styleUrl}
          style={{ width: "100%", height: "100%" }}
          attributionControl={{}}
          onLoad={(event) => setMapInstance(event.target)}
        >
          <NavigationControl position="top-left" visualizePitch />
          <Building3DMapLayers
            map={mapInstance}
            building={building}
            selectedFloorId={floor.id}
            route={route}
          />
        </Map>
        <p className="sr-only">{attribution}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="min-h-11 rounded-xl bg-[#005B7F] px-4 text-sm font-semibold text-white"
          onClick={() => void findRoute()}
        >
          Find accessible route
        </button>
        <button
          type="button"
          className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold"
          onClick={() => {
            setFromPoiId(undefined);
            setToPoiId(undefined);
            setRoute(null);
            setRouteError(null);
          }}
        >
          Clear selection
        </button>
      </div>

      {routeError ? (
        <p className="text-sm text-destructive" role="alert">
          {routeError}
        </p>
      ) : null}

      {route ? (
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {route.steps.map((step, index) => (
            <li key={`${step.fromPoiId}-${step.toPoiId}-${index}`}>
              {step.instruction}
            </li>
          ))}
        </ol>
      ) : null}

      <ul className="grid gap-2 sm:grid-cols-2" aria-label="Points on this floor">
        {visiblePois.map((poi) => {
          const isFrom = fromPoiId === poi.id;
          const isTo = toPoiId === poi.id;
          return (
            <li key={poi.id}>
              <button
                type="button"
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                  isFrom || isTo
                    ? "border-[#005B7F] bg-[#005B7F]/5"
                    : "border-border"
                }`}
                onClick={() => handlePoiSelect(poi.id)}
              >
                <span className="font-medium">{INDOOR_POI_LABELS[poi.type]}</span>
                <span className="text-muted-foreground"> — {poi.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
