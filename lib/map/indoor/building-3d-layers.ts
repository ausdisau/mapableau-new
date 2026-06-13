import type { IndoorBuildingView, IndoorFloorView, IndoorRouteView } from "@/lib/access-indoor/types";
import { INDOOR_POI_LABELS } from "@/lib/access-indoor/types";
import { MAP_LAYER_IDS, MAP_SOURCE_IDS } from "@/lib/map/map-layer-ids";

import {
  boundsFromFootprint,
  footprintCentroid,
  imageBoundsFromFootprint,
  normalizedToLngLat,
  parseImageBounds,
  type ImageBounds,
} from "./coordinate-transform";

export type Building3DLayerBundle = {
  shell: GeoJSON.FeatureCollection;
  floorSlices: GeoJSON.FeatureCollection;
  pois: GeoJSON.FeatureCollection;
  route: GeoJSON.FeatureCollection;
  mapCenter: { lng: number; lat: number };
  mapBounds: [[number, number], [number, number]] | null;
  floorImage?: {
    url: string;
    coordinates: [
      [number, number],
      [number, number],
      [number, number],
      [number, number],
    ];
  };
};

function parseFootprint(raw: unknown): GeoJSON.Polygon | GeoJSON.MultiPolygon | null {
  if (!raw || typeof raw !== "object") return null;
  const feature = raw as GeoJSON.Feature | GeoJSON.Polygon | GeoJSON.MultiPolygon;
  if ("type" in feature && feature.type === "Feature") {
    const geom = feature.geometry;
    if (geom.type === "Polygon" || geom.type === "MultiPolygon") return geom;
    return null;
  }
  if ("type" in feature && (feature.type === "Polygon" || feature.type === "MultiPolygon")) {
    return feature;
  }
  return null;
}

function resolveFloorHeight(
  floor: IndoorFloorView,
  building: IndoorBuildingView
): number {
  return floor.floorHeightMeters ?? building.defaultFloorHeightMeters;
}

function resolveFloorElevation(
  floor: IndoorFloorView,
  building: IndoorBuildingView
): number {
  if (floor.elevationMeters != null) return floor.elevationMeters;
  return building.baseElevationMeters + floor.levelIndex * resolveFloorHeight(floor, building);
}

function resolveBounds(
  floor: IndoorFloorView,
  building: IndoorBuildingView
): ImageBounds | null {
  const parsed = parseImageBounds(floor.imageBounds);
  if (parsed) return parsed;

  const footprint = parseFootprint(building.footprintGeoJson);
  if (!footprint) return null;

  return imageBoundsFromFootprint(footprint);
}

function georefPoi(
  poi: IndoorFloorView["pois"][number],
  floor: IndoorFloorView,
  building: IndoorBuildingView,
  fallback: { lng: number; lat: number } | null
) {
  const bounds = resolveBounds(floor, building);
  const [lng, lat] = normalizedToLngLat(
    poi.xNorm,
    poi.yNorm,
    bounds,
    fallback ?? undefined
  );

  return { lng, lat };
}

export function buildBuilding3DLayers(params: {
  building: IndoorBuildingView;
  selectedFloorId: string;
  route?: IndoorRouteView | null;
}): Building3DLayerBundle {
  const { building, selectedFloorId, route } = params;
  const footprint = parseFootprint(building.footprintGeoJson);
  const centroid = footprintCentroid(footprint);
  const shellHeight =
    building.totalHeightMeters ??
    building.baseElevationMeters +
      building.floors.length * building.defaultFloorHeightMeters;

  const shell: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: footprint
      ? [
          {
            type: "Feature",
            properties: {
              height: shellHeight,
              base: building.baseElevationMeters,
              name: building.name,
            },
            geometry: footprint,
          },
        ]
      : [],
  };

  const floorSlices: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: building.floors.flatMap((floor) => {
      if (!footprint) return [];
      const elevation = resolveFloorElevation(floor, building);
      const height = resolveFloorHeight(floor, building);
      const selected = floor.id === selectedFloorId;

      return [
        {
          type: "Feature" as const,
          properties: {
            floorId: floor.id,
            label: floor.label,
            base: elevation,
            height,
            selected,
            opacity: selected ? 0.85 : 0.35,
          },
          geometry: footprint,
        },
      ];
    }),
  };

  const poiFeatures: GeoJSON.Feature[] = [];
  for (const floor of building.floors) {
    if (floor.id !== selectedFloorId) continue;
    for (const poi of floor.pois) {
      const { lng, lat } = georefPoi(poi, floor, building, centroid);
      poiFeatures.push({
        type: "Feature",
        properties: {
          id: poi.id,
          name: poi.name,
          type: poi.type,
          label: INDOOR_POI_LABELS[poi.type],
        },
        geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
      });
    }
  }

  const routeFeatures: GeoJSON.Feature[] = [];
  if (route && centroid) {
    const selectedFloor = building.floors.find((f) => f.id === selectedFloorId);
    const segment = route.segments.find((s) => s.floorId === selectedFloorId);
    if (selectedFloor && segment && segment.path.length > 1) {
      const bounds = resolveBounds(selectedFloor, building);
      routeFeatures.push({
        type: "Feature",
        properties: { floorId: selectedFloorId },
        geometry: {
          type: "LineString",
          coordinates: segment.path.map((point) =>
            normalizedToLngLat(point.x, point.y, bounds, centroid)
          ),
        },
      });
    }
  }

  let mapBounds: [[number, number], [number, number]] | null = null;
  if (footprint) {
    mapBounds = boundsFromFootprint(footprint);
  }

  const selectedFloor = building.floors.find((f) => f.id === selectedFloorId);
  let floorImage: Building3DLayerBundle["floorImage"];
  if (selectedFloor?.floorPlanImageUrl) {
    const bounds = resolveBounds(selectedFloor, building);
    if (bounds) {
      floorImage = {
        url: selectedFloor.floorPlanImageUrl,
        coordinates: [
          [bounds.northWest.lng, bounds.northWest.lat],
          [bounds.southEast.lng, bounds.northWest.lat],
          [bounds.southEast.lng, bounds.southEast.lat],
          [bounds.northWest.lng, bounds.southEast.lat],
        ],
      };
    }
  }

  return {
    shell,
    floorSlices,
    pois: { type: "FeatureCollection", features: poiFeatures },
    route: { type: "FeatureCollection", features: routeFeatures },
    mapCenter: centroid ?? { lng: 151.0031, lat: -33.815 },
    mapBounds,
    floorImage,
  };
}

export function buildingSupports3D(building: IndoorBuildingView): boolean {
  return Boolean(building.footprintGeoJson && building.floors.length > 0);
}

export const BUILDING_3D_SOURCE_IDS = {
  shell: `${MAP_SOURCE_IDS.indoorFloorPlan}-shell`,
  floorSlices: `${MAP_SOURCE_IDS.indoorFloorPlan}-slices`,
  pois: MAP_SOURCE_IDS.indoorPois,
  route: MAP_SOURCE_IDS.indoorRoute,
  floorImage: `${MAP_SOURCE_IDS.indoorFloorPlan}-image`,
} as const;

export const BUILDING_3D_LAYER_IDS = {
  shell: `${MAP_LAYER_IDS.indoorFloorPlan}-shell`,
  floorSlices: `${MAP_LAYER_IDS.indoorFloorPlan}-slices`,
  pois: MAP_LAYER_IDS.indoorPois,
  route: MAP_LAYER_IDS.indoorRoute,
  floorImage: `${MAP_LAYER_IDS.indoorFloorPlan}-image`,
} as const;
