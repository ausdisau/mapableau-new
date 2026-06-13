import { describe, expect, it } from "vitest";

import {
  computeIndoorRoute,
  parseIndoorRoutingProfile,
} from "@/lib/access-indoor/routing-service";
import type { IndoorBuildingView } from "@/lib/access-indoor/types";
import {
  buildBuilding3DLayers,
  buildingSupports3D,
} from "@/lib/map/indoor/building-3d-layers";
import {
  imageBoundsFromFootprint,
  normalizedToLngLat,
  parseImageBounds,
} from "@/lib/map/indoor/coordinate-transform";
import { createRectFootprintGeoJson } from "@/lib/access-indoor/indoor-service";

describe("coordinate transform", () => {
  const bounds = {
    northWest: { lng: 151.0, lat: -33.81 },
    southEast: { lng: 151.01, lat: -33.82 },
  };

  it("maps normalized corners to lng/lat", () => {
    const nw = normalizedToLngLat(0, 0, bounds);
    const se = normalizedToLngLat(1, 1, bounds);

    expect(nw[0]).toBeCloseTo(151.0, 5);
    expect(nw[1]).toBeCloseTo(-33.81, 5);
    expect(se[0]).toBeCloseTo(151.01, 5);
    expect(se[1]).toBeCloseTo(-33.82, 5);
  });

  it("falls back to centroid when bounds are missing", () => {
    const [lng, lat] = normalizedToLngLat(0.5, 0.5, null, {
      lng: 151.0031,
      lat: -33.815,
    });
    expect(lng).toBe(151.0031);
    expect(lat).toBe(-33.815);
  });

  it("parses image bounds from JSON", () => {
    const parsed = parseImageBounds({
      northWest: { lng: 1, lat: 2 },
      southEast: { lng: 3, lat: 4 },
    });
    expect(parsed?.northWest.lng).toBe(1);
    expect(parsed?.southEast.lat).toBe(4);
  });

  it("derives bounds from footprint polygon", () => {
    const footprint = createRectFootprintGeoJson({
      centerLat: -33.815,
      centerLng: 151.0031,
      widthMeters: 100,
      heightMeters: 80,
    });
    const derived = imageBoundsFromFootprint(footprint);
    expect(derived.northWest.lat).toBeGreaterThan(derived.southEast.lat);
    expect(derived.southEast.lng).toBeGreaterThan(derived.northWest.lng);
  });
});

describe("building 3D layers", () => {
  const footprint = createRectFootprintGeoJson({
    centerLat: -33.815,
    centerLng: 151.0031,
    widthMeters: 100,
    heightMeters: 80,
  });

  const building: IndoorBuildingView = {
    id: "b1",
    name: "Main mall",
    positioningVendor: "none",
    positioningEmbedUrl: null,
    externalVendorId: null,
    positioningEnabled: false,
    footprintGeoJson: footprint,
    baseElevationMeters: 0,
    totalHeightMeters: 7,
    defaultFloorHeightMeters: 3.5,
    floors: [
      {
        id: "f0",
        levelIndex: 0,
        label: "Ground",
        sortOrder: 0,
        floorPlanImageUrl: null,
        imageBounds: {
          northWest: { lng: footprint.coordinates[0][0][0], lat: footprint.coordinates[0][0][1] },
          southEast: { lng: footprint.coordinates[0][2][0], lat: footprint.coordinates[0][2][1] },
        },
        vectorGeoJson: null,
        widthMeters: null,
        heightMeters: null,
        floorHeightMeters: null,
        elevationMeters: null,
        pois: [
          {
            id: "p1",
            type: "entrance",
            name: "Entrance",
            xNorm: 0.1,
            yNorm: 0.9,
            accessibleRouteOnly: false,
            featureType: null,
            notes: null,
          },
        ],
      },
    ],
  };

  it("detects 3D-capable buildings", () => {
    expect(buildingSupports3D(building)).toBe(true);
    expect(
      buildingSupports3D({
        ...building,
        footprintGeoJson: null,
      })
    ).toBe(false);
  });

  it("builds shell, floor slice, and POI GeoJSON", () => {
    const layers = buildBuilding3DLayers({
      building,
      selectedFloorId: "f0",
      route: null,
    });

    expect(layers.shell.features).toHaveLength(1);
    expect(layers.floorSlices.features).toHaveLength(1);
    expect(layers.pois.features).toHaveLength(1);
    expect(layers.mapBounds).not.toBeNull();
  });

  it("builds route line geometry for selected floor", () => {
    const layers = buildBuilding3DLayers({
      building,
      selectedFloorId: "f0",
      route: {
        fromPoiId: "p1",
        toPoiId: "p2",
        totalWeight: 1,
        steps: [],
        segments: [
          {
            floorId: "f0",
            floorLabel: "Ground",
            path: [
              { x: 0.1, y: 0.9 },
              { x: 0.5, y: 0.5 },
            ],
          },
        ],
      },
    });

    expect(layers.route.features).toHaveLength(1);
    expect(layers.route.features[0]?.geometry.type).toBe("LineString");
  });
});

describe("multi-floor routing via vertical edges", () => {
  const nodes = [
    {
      poi: {
        id: "lift-g",
        name: "Lift ground",
        type: "lift" as const,
        xNorm: 0.5,
        yNorm: 0.5,
      },
      floorId: "f0",
      floorLabel: "Ground",
    },
    {
      poi: {
        id: "lift-1",
        name: "Lift level 1",
        type: "lift" as const,
        xNorm: 0.5,
        yNorm: 0.5,
      },
      floorId: "f1",
      floorLabel: "Level 1",
    },
    {
      poi: {
        id: "toilet-1",
        name: "Toilet level 1",
        type: "accessible_toilet" as const,
        xNorm: 0.8,
        yNorm: 0.2,
      },
      floorId: "f1",
      floorLabel: "Level 1",
    },
  ];

  const edges = [
    {
      id: "e1",
      floorId: "f1",
      fromPoiId: "lift-1",
      toPoiId: "toilet-1",
      weight: 1,
      requiresStairs: false,
      maxGrade: null,
      minDoorWidthCm: null,
      accessibleOnly: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const verticalEdges = [
    {
      id: "v1",
      buildingId: "b1",
      fromFloorId: "f0",
      toFloorId: "f1",
      fromPoiId: "lift-g",
      toPoiId: "lift-1",
      weight: 2,
      requiresStairs: false,
      accessibleOnly: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it("routes across floors using a lift edge", () => {
    const route = computeIndoorRoute({
      nodes,
      edges,
      verticalEdges,
      fromPoiId: "lift-g",
      toPoiId: "toilet-1",
      profile: parseIndoorRoutingProfile({ wheelchair: true, avoidStairs: true }),
    });

    expect(route).not.toBeNull();
    expect(route?.steps.some((s) => s.instruction.includes("lift"))).toBe(true);
    expect(route?.segments.some((s) => s.floorId === "f1")).toBe(true);
  });
});
