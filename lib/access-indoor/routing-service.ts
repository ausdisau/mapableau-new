import type { AccessIndoorEdge, AccessIndoorPoi } from "@prisma/client";

import type { IndoorRouteStep, IndoorRouteView } from "@/lib/access-indoor/types";

export type IndoorRoutingProfile = {
  wheelchairUser: boolean;
  avoidStairs: boolean;
};

export type RouteGraphNode = {
  poi: Pick<AccessIndoorPoi, "id" | "name" | "type" | "xNorm" | "yNorm">;
  floorId: string;
  floorLabel: string;
};

type WeightedEdge = {
  to: string;
  weight: number;
  edge: AccessIndoorEdge;
};

function edgeAllowed(
  edge: AccessIndoorEdge,
  profile: IndoorRoutingProfile
): boolean {
  if (profile.avoidStairs && edge.requiresStairs) return false;
  if (profile.wheelchairUser && edge.requiresStairs) return false;
  return true;
}

function edgeWeight(
  edge: AccessIndoorEdge,
  from: RouteGraphNode,
  to: RouteGraphNode
): number {
  const dx = from.poi.xNorm - to.poi.xNorm;
  const dy = from.poi.yNorm - to.poi.yNorm;
  const distance = Math.hypot(dx, dy);
  return edge.weight + distance;
}

function buildAdjacency(
  nodes: Map<string, RouteGraphNode>,
  edges: AccessIndoorEdge[],
  profile: IndoorRoutingProfile
): Map<string, WeightedEdge[]> {
  const adj = new Map<string, WeightedEdge[]>();

  for (const edge of edges) {
    if (!edgeAllowed(edge, profile)) continue;
    const from = nodes.get(edge.fromPoiId);
    const to = nodes.get(edge.toPoiId);
    if (!from || !to) continue;

    const weight = edgeWeight(edge, from, to);
    const forward: WeightedEdge = { to: edge.toPoiId, weight, edge };
    const reverse: WeightedEdge = {
      to: edge.fromPoiId,
      weight,
      edge: { ...edge, fromPoiId: edge.toPoiId, toPoiId: edge.fromPoiId },
    };

    adj.set(edge.fromPoiId, [...(adj.get(edge.fromPoiId) ?? []), forward]);
    adj.set(edge.toPoiId, [...(adj.get(edge.toPoiId) ?? []), reverse]);
  }

  return adj;
}

function dijkstra(
  startId: string,
  endId: string,
  adj: Map<string, WeightedEdge[]>
): { path: string[]; totalWeight: number } | null {
  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const visited = new Set<string>();
  const queue = new Set<string>([startId]);
  dist.set(startId, 0);

  while (queue.size > 0) {
    let current: string | null = null;
    let currentDist = Infinity;
    for (const id of queue) {
      const d = dist.get(id) ?? Infinity;
      if (d < currentDist) {
        currentDist = d;
        current = id;
      }
    }
    if (current == null) break;
    if (current === endId) break;

    queue.delete(current);
    visited.add(current);

    for (const neighbor of adj.get(current) ?? []) {
      if (visited.has(neighbor.to)) continue;
      const alt = currentDist + neighbor.weight;
      if (alt < (dist.get(neighbor.to) ?? Infinity)) {
        dist.set(neighbor.to, alt);
        prev.set(neighbor.to, current);
        queue.add(neighbor.to);
      }
    }
  }

  if (!prev.has(endId) && startId !== endId) return null;

  const path: string[] = [];
  let cursor: string | undefined = endId;
  while (cursor) {
    path.unshift(cursor);
    cursor = prev.get(cursor);
  }

  return {
    path,
    totalWeight: dist.get(endId) ?? 0,
  };
}

function instructionForStep(
  from: RouteGraphNode,
  to: RouteGraphNode,
  edge: AccessIndoorEdge
): string {
  if (from.floorId !== to.floorId) {
    return `Take the lift to ${to.floorLabel}`;
  }
  if (edge.requiresStairs) {
    return `Use stairs toward ${to.poi.name}`;
  }
  if (to.poi.type === "lift") {
    return `Continue to ${to.poi.name}`;
  }
  if (to.poi.type === "accessible_toilet") {
    return `Accessible toilet (${to.poi.name}) is ahead`;
  }
  return `Go to ${to.poi.name}`;
}

export function computeIndoorRoute(params: {
  nodes: RouteGraphNode[];
  edges: AccessIndoorEdge[];
  fromPoiId: string;
  toPoiId: string;
  profile: IndoorRoutingProfile;
}): IndoorRouteView | null {
  const nodeMap = new Map(params.nodes.map((n) => [n.poi.id, n]));
  if (!nodeMap.has(params.fromPoiId) || !nodeMap.has(params.toPoiId)) {
    return null;
  }

  const adj = buildAdjacency(nodeMap, params.edges, params.profile);
  const result = dijkstra(params.fromPoiId, params.toPoiId, adj);
  if (!result) return null;

  const steps: IndoorRouteStep[] = [];
  const segments: IndoorRouteView["segments"] = [];

  for (let i = 0; i < result.path.length - 1; i += 1) {
    const fromId = result.path[i];
    const toId = result.path[i + 1];
    const from = nodeMap.get(fromId);
    const to = nodeMap.get(toId);
    if (!from || !to) continue;

    const edge = (adj.get(fromId) ?? []).find((e) => e.to === toId)?.edge;
    if (!edge) continue;

    steps.push({
      instruction: instructionForStep(from, to, edge),
      floorId: from.floorId,
      floorLabel: from.floorLabel,
      fromPoiId: fromId,
      toPoiId: toId,
    });

    let segment = segments.find((s) => s.floorId === from.floorId);
    if (!segment) {
      segment = {
        floorId: from.floorId,
        floorLabel: from.floorLabel,
        path: [{ x: from.poi.xNorm, y: from.poi.yNorm }],
      };
      segments.push(segment);
    }
    segment.path.push({ x: to.poi.xNorm, y: to.poi.yNorm });
  }

  return {
    fromPoiId: params.fromPoiId,
    toPoiId: params.toPoiId,
    totalWeight: result.totalWeight,
    steps,
    segments,
  };
}

export function parseIndoorRoutingProfile(raw: {
  wheelchair?: boolean;
  avoidStairs?: boolean;
}): IndoorRoutingProfile {
  return {
    wheelchairUser: raw.wheelchair ?? true,
    avoidStairs: raw.avoidStairs ?? true,
  };
}
