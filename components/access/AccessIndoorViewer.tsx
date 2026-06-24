"use client";

import { useMemo, useState } from "react";

import {
  INDOOR_POI_LABELS,
  type IndoorBuildingView,
  type IndoorFloorView,
  type IndoorPlaceView,
  type IndoorRouteView,
} from "@/lib/access-indoor/types";
import {
  filterPoisByAccessibility,
  routePathsForFloor,
  routeSegmentToSvgPath,
} from "@/lib/map/indoor/indoor-map-mappers";
import { ACCESS_DISCLAIMER } from "@/lib/access-map/copy";

function FloorSelector({
  floors,
  selectedFloorId,
  onSelect,
}: {
  floors: IndoorFloorView[];
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

function IndoorFloorMap({
  floor,
  route,
  accessibleFilter,
  onSelectPoi,
  selectedFrom,
  selectedTo,
}: {
  floor: IndoorFloorView;
  route: IndoorRouteView | null;
  accessibleFilter: boolean;
  onSelectPoi: (poiId: string) => void;
  selectedFrom?: string;
  selectedTo?: string;
}) {
  const pois = useMemo(
    () => filterPoisByAccessibility(floor.pois, accessibleFilter),
    [floor.pois, accessibleFilter]
  );

  const routePath = route ? routePathsForFloor(route, floor.id) : [];

  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-slate-100"
      role="img"
      aria-label={`Floor plan for ${floor.label}`}
    >
      {floor.floorPlanImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={floor.floorPlanImageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-contain"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
          Floor plan preview unavailable
        </div>
      )}

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {routePath.length > 1 ? (
          <path
            d={routeSegmentToSvgPath(routePath)}
            fill="none"
            stroke="#005B7F"
            strokeWidth={0.015}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </svg>

      {pois.map((poi) => {
        const isFrom = selectedFrom === poi.id;
        const isTo = selectedTo === poi.id;
        return (
          <button
            key={poi.id}
            type="button"
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 px-2 py-1 text-xs font-semibold shadow-sm ${
              isFrom || isTo
                ? "border-[#005B7F] bg-[#005B7F] text-white"
                : "border-white bg-white text-[#0C1833]"
            }`}
            style={{
              left: `${poi.xNorm * 100}%`,
              top: `${poi.yNorm * 100}%`,
            }}
            onClick={() => onSelectPoi(poi.id)}
            aria-label={`${INDOOR_POI_LABELS[poi.type]}: ${poi.name}`}
          >
            {INDOOR_POI_LABELS[poi.type]}
          </button>
        );
      })}
    </div>
  );
}

function PositioningEmbed({ building }: { building: IndoorBuildingView }) {
  if (!building.positioningEnabled || !building.positioningEmbedUrl) return null;

  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold">Live indoor positioning</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Positioning provided by {building.positioningVendor}. MapAble remains the
        source of truth for accessibility points and routes.
      </p>
      <iframe
        title={`Indoor positioning for ${building.name}`}
        src={building.positioningEmbedUrl}
        className="mt-3 h-64 w-full rounded-md border border-border"
        loading="lazy"
      />
    </div>
  );
}

export function AccessIndoorViewer({
  placeId,
  indoor,
}: {
  placeId: string;
  indoor: IndoorPlaceView;
}) {
  const building = indoor.buildings[0];
  const [selectedFloorId, setSelectedFloorId] = useState(building.floors[0]?.id ?? "");
  const [accessibleOnly, setAccessibleOnly] = useState(true);
  const [fromPoiId, setFromPoiId] = useState<string | undefined>();
  const [toPoiId, setToPoiId] = useState<string | undefined>();
  const [route, setRoute] = useState<IndoorRouteView | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const floor =
    building.floors.find((f) => f.id === selectedFloorId) ?? building.floors[0];

  async function findRoute() {
    if (!fromPoiId || !toPoiId) {
      setRouteError("Select a start and destination point on the map.");
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
    <section className="space-y-4" aria-label="Indoor map">
      <div>
        <h2 className="text-lg font-semibold">Indoor map</h2>
        <p className="text-sm text-muted-foreground">
          {building.name}. Select floor, then tap two points for an accessible
          route. {ACCESS_DISCLAIMER}
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

      <IndoorFloorMap
        floor={floor}
        route={route}
        accessibleFilter={accessibleOnly}
        onSelectPoi={handlePoiSelect}
        selectedFrom={fromPoiId}
        selectedTo={toPoiId}
      />

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
        {visiblePois.map((poi) => (
          <li
            key={poi.id}
            className="rounded-lg border border-border px-3 py-2 text-sm"
          >
            <span className="font-medium">{INDOOR_POI_LABELS[poi.type]}</span>
            <span className="text-muted-foreground"> — {poi.name}</span>
          </li>
        ))}
      </ul>

      <PositioningEmbed building={building} />
    </section>
  );
}

export function hasPublishedIndoor(indoor: IndoorPlaceView | null): indoor is IndoorPlaceView {
  return Boolean(indoor && indoor.buildings.some((b) => b.floors.length > 0));
}
