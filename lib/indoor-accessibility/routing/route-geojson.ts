import type { IndoorRouteGraph } from "@/lib/indoor-accessibility/schemas/core";
import type { RouteMode } from "@/lib/indoor-accessibility/schemas/core";
import type { RoutePlanResult } from "@/lib/indoor-accessibility/routing/route-planner";

export type RouteGeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: "LineString";
      coordinates: Array<[number, number]>;
    };
    properties: {
      distance: number;
      mode: RouteMode;
      trustWarning?: string;
      nodeIds: string[];
      found: true;
    };
  }>;
};

/**
 * Map a successful indoor route onto a GeoJSON FeatureCollection for canvas rendering.
 * Coordinates use floor-plan normalised [x, y] (not WGS84) unless nodes carry lon/lat later.
 */
export function toRouteGeoJson(
  result: Extract<RoutePlanResult, { found: true }>,
  graph: IndoorRouteGraph,
  mode: RouteMode,
): RouteGeoJsonFeatureCollection {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const coordinates: Array<[number, number]> = [];

  for (const nodeId of result.nodeIds) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;
    coordinates.push([node.position.x, node.position.y]);
  }

  return {
    type: "FeatureCollection",
    features:
      coordinates.length >= 2
        ? [
            {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates,
              },
              properties: {
                distance: result.totalDistanceMetres,
                mode,
                trustWarning: result.trustWarning,
                nodeIds: result.nodeIds,
                found: true,
              },
            },
          ]
        : [],
  };
}
