import { describe, expect, it } from "vitest";

import {
  filterPoisByAccessibility,
  routeSegmentToSvgPath,
} from "@/lib/map/indoor/indoor-map-mappers";
import {
  computeIndoorRoute,
  parseIndoorRoutingProfile,
} from "@/lib/access-indoor/routing-service";
import {
  isIndoorPositioningEnabled,
  resolveBuildingPositioning,
} from "@/lib/config/indoor-mapping";

describe("access indoor routing", () => {
  const nodes = [
    {
      poi: {
        id: "a",
        name: "Entrance",
        type: "entrance" as const,
        xNorm: 0.1,
        yNorm: 0.9,
      },
      floorId: "f1",
      floorLabel: "Ground",
    },
    {
      poi: {
        id: "b",
        name: "Lift",
        type: "lift" as const,
        xNorm: 0.5,
        yNorm: 0.5,
      },
      floorId: "f1",
      floorLabel: "Ground",
    },
    {
      poi: {
        id: "c",
        name: "Toilet",
        type: "accessible_toilet" as const,
        xNorm: 0.8,
        yNorm: 0.2,
      },
      floorId: "f1",
      floorLabel: "Ground",
    },
  ];

  const edges = [
    {
      id: "e1",
      floorId: "f1",
      fromPoiId: "a",
      toPoiId: "b",
      weight: 1,
      requiresStairs: false,
      maxGrade: null,
      minDoorWidthCm: null,
      accessibleOnly: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "e2",
      floorId: "f1",
      fromPoiId: "b",
      toPoiId: "c",
      weight: 1,
      requiresStairs: false,
      maxGrade: null,
      minDoorWidthCm: null,
      accessibleOnly: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "e3",
      floorId: "f1",
      fromPoiId: "a",
      toPoiId: "c",
      weight: 0.5,
      requiresStairs: true,
      maxGrade: null,
      minDoorWidthCm: null,
      accessibleOnly: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it("finds a step-free route when stairs must be avoided", () => {
    const route = computeIndoorRoute({
      nodes,
      edges,
      fromPoiId: "a",
      toPoiId: "c",
      profile: parseIndoorRoutingProfile({ wheelchair: true, avoidStairs: true }),
    });

    expect(route).not.toBeNull();
    expect(route?.steps.length).toBe(2);
    expect(route?.segments[0]?.path.length).toBeGreaterThan(1);
  });

  it("maps normalized route points to svg path commands", () => {
    const path = routeSegmentToSvgPath([
      { x: 0.1, y: 0.2 },
      { x: 0.5, y: 0.5 },
    ]);
    expect(path).toContain("M 0.1000 0.2000");
    expect(path).toContain("L 0.5000 0.5000");
  });
});

describe("access indoor mappers", () => {
  it("filters to accessible amenity types when requested", () => {
    const filtered = filterPoisByAccessibility(
      [
        {
          id: "1",
          type: "stairs",
          name: "Stairs",
          xNorm: 0.1,
          yNorm: 0.1,
          accessibleRouteOnly: false,
          featureType: null,
          notes: null,
        },
        {
          id: "2",
          type: "lift",
          name: "Lift",
          xNorm: 0.2,
          yNorm: 0.2,
          accessibleRouteOnly: false,
          featureType: null,
          notes: null,
        },
      ],
      true
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.type).toBe("lift");
  });
});

describe("indoor positioning config", () => {
  it("enables vendor embed when configured on building", () => {
    const config = resolveBuildingPositioning({
      positioningVendor: "bindimaps",
      positioningEmbedUrl: "https://example.com/embed",
      externalVendorId: "venue-123",
    });

    expect(isIndoorPositioningEnabled(config)).toBe(true);
    expect(config.vendor).toBe("bindimaps");
  });
});
