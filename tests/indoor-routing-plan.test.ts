import { describe, expect, it } from "vitest";

import { getDemoFloorPlanDetail } from "@/lib/demo/floor-plan-fixture";
import {
  buildPgrAstarSql,
  IN_MEMORY_ENGINE,
} from "@/lib/indoor-accessibility/routing/pgrouting-adapter";
import { toRouteGeoJson } from "@/lib/indoor-accessibility/routing/route-geojson";
import {
  edgeCost,
  planIndoorRoute,
  resolveModeFromMobility,
} from "@/lib/indoor-accessibility/routing/route-planner";
import type { IndoorRouteEdge, IndoorRouteGraph } from "@/lib/indoor-accessibility/schemas/core";

function demoGraph(): IndoorRouteGraph {
  const detail = getDemoFloorPlanDetail(
    "demo-parramatta-library",
    "demo-parramatta-ground",
  )!;
  return detail.plan.routeGraph!;
}

function withStairs(graph: IndoorRouteGraph): IndoorRouteGraph {
  const stairEdge: IndoorRouteEdge = {
    id: "edge-stair-shortcut",
    fromNodeId: "node-entrance",
    toNodeId: "node-toilet",
    bidirectional: true,
    stepFree: false,
    distanceMetres: 3,
    trustLevel: "mapable_verified",
    restricted: false,
    maximumGradient: "1:8",
    surfaceType: "carpet",
  };
  return {
    ...graph,
    edges: [...graph.edges, stairEdge],
  };
}

describe("mobility cost multipliers", () => {
  it("maps wheelchair-like mobilityProfile to step_free mode", () => {
    expect(resolveModeFromMobility({ excludeStairs: true }).mode).toBe(
      "step_free",
    );
    expect(resolveModeFromMobility({ excludeStairs: false }).mode).toBe(
      "shortest_verified",
    );
  });

  it("excludes stairs when excludeStairs is true", () => {
    const edge: IndoorRouteEdge = {
      id: "e1",
      fromNodeId: "a",
      toNodeId: "b",
      bidirectional: true,
      stepFree: false,
      distanceMetres: 5,
      trustLevel: "mapable_verified",
      restricted: false,
    };
    expect(
      edgeCost(edge, "shortest_verified", undefined, { excludeStairs: true }),
    ).toBeNull();
    expect(
      edgeCost(edge, "shortest_verified", undefined, { excludeStairs: false }),
    ).toBe(5);
  });

  it("applies gradientPenalty and surfaceFriction when edge fields present", () => {
    const edge: IndoorRouteEdge = {
      id: "e2",
      fromNodeId: "a",
      toNodeId: "b",
      bidirectional: true,
      stepFree: true,
      distanceMetres: 10,
      maximumGradient: "1:10",
      surfaceType: "carpet",
      trustLevel: "mapable_verified",
      restricted: false,
    };
    const base = edgeCost(edge, "step_free");
    const penalised = edgeCost(edge, "step_free", undefined, {
      gradientPenalty: 2,
      surfaceFriction: 1.5,
    });
    expect(base).toBe(10);
    expect(penalised).toBe(10 * 2 * 1.5);
  });

  it("uses documented defaults when gradient/surface absent (no extra multiplier)", () => {
    const edge: IndoorRouteEdge = {
      id: "e3",
      fromNodeId: "a",
      toNodeId: "b",
      bidirectional: true,
      stepFree: true,
      distanceMetres: 10,
      trustLevel: "mapable_verified",
      restricted: false,
    };
    expect(
      edgeCost(edge, "step_free", undefined, {
        gradientPenalty: 3,
        surfaceFriction: 4,
      }),
    ).toBe(10);
  });
});

describe("toRouteGeoJson", () => {
  it("returns a LineString FeatureCollection for a found route", () => {
    const graph = demoGraph();
    const result = planIndoorRoute({
      graph,
      fromNodeId: "node-entrance",
      toNodeId: "node-toilet",
      mode: "step_free",
    });
    expect(result.found).toBe(true);
    if (!result.found) return;

    const fc = toRouteGeoJson(result, graph, "step_free");
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0].geometry.type).toBe("LineString");
    expect(fc.features[0].geometry.coordinates.length).toBeGreaterThanOrEqual(2);
    expect(fc.features[0].properties.distance).toBe(result.totalDistanceMetres);
    expect(fc.features[0].properties.mode).toBe("step_free");
  });
});

describe("pgRouting SQL seam", () => {
  it("documents pgr_astar with mobility cost multipliers (string contract only)", () => {
    const sql = buildPgrAstarSql({
      startNodeId: "node-entrance",
      endNodeId: "node-toilet",
      excludeStairs: true,
      gradientPenalty: 2,
      surfaceFriction: 1.5,
      minDoorWidthMm: 850,
    });
    expect(sql).toContain("pgr_astar");
    expect(sql).toContain("step_free");
    expect(sql).toContain("2");
    expect(sql).toContain("1.5");
    expect(sql).toContain("850");
    expect(sql).toContain("node-entrance");
    expect(IN_MEMORY_ENGINE).toBe("in_memory_dijkstra");
  });
});

describe("planIndoorRoute with stair shortcut", () => {
  it("avoids stair shortcut when excludeStairs defaults on", () => {
    const graph = withStairs(demoGraph());
    const result = planIndoorRoute({
      graph,
      fromNodeId: "node-entrance",
      toNodeId: "node-toilet",
      mode: "shortest_verified",
      mobilityProfile: { excludeStairs: true },
    });
    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.edges.some((e) => e.id === "edge-stair-shortcut")).toBe(
        false,
      );
    }
  });
});
