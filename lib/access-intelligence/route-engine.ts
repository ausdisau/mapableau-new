import { AccessIntelligenceError } from "./errors";
import {
  calculateRouteCost,
  hardRequirementRejectionReasons,
} from "./route-cost";
import type {
  AccessPassport,
  AccessibleRoute,
  LiveIncident,
  RouteEdge,
  RouteNode,
} from "./schemas";

type RouteStep = AccessibleRoute["steps"][number];

export type RouteEngineInput = {
  placeId: string;
  nodes: RouteNode[];
  edges: RouteEdge[];
  passport: AccessPassport;
  fromNodeId: string;
  toNodeId: string;
  incidents?: LiveIncident[];
};

export type RouteEngineResult = {
  recommended: AccessibleRoute | null;
  fallback: AccessibleRoute | null;
  rejected: Array<{ summary: string; reasons: string[] }>;
};

function activeBlockingEdgeIds(incidents: LiveIncident[] | undefined): Set<string> {
  const ids = new Set<string>();
  for (const incident of incidents ?? []) {
    if (incident.status !== "active") continue;
    if (
      incident.type === "lift_outage" ||
      incident.type === "blocked_route" ||
      incident.type === "locked_entrance" ||
      incident.type === "construction" ||
      incident.type === "flooding"
    ) {
      for (const edgeId of incident.affectedEdgeIds) ids.add(edgeId);
    }
  }
  return ids;
}

function liftOutageElementIds(incidents: LiveIncident[] | undefined): Set<string> {
  const ids = new Set<string>();
  for (const incident of incidents ?? []) {
    if (incident.status === "active" && incident.type === "lift_outage" && incident.elementId) {
      ids.add(incident.elementId);
    }
  }
  return ids;
}

type PathResult = {
  nodeIds: string[];
  edgeIds: string[];
  cost: number;
};

function dijkstra(
  nodes: RouteNode[],
  eligibleEdges: Array<{ edge: RouteEdge; cost: number }>,
  fromId: string,
  toId: string,
): PathResult | null {
  const adj = new Map<string, Array<{ to: string; edgeId: string; cost: number }>>();
  for (const node of nodes) adj.set(node.id, []);
  for (const { edge, cost } of eligibleEdges) {
    adj.get(edge.fromNodeId)?.push({ to: edge.toNodeId, edgeId: edge.id, cost });
    // undirected for indoor walking graphs
    adj.get(edge.toNodeId)?.push({ to: edge.fromNodeId, edgeId: edge.id, cost });
  }

  const dist = new Map<string, number>();
  const prev = new Map<string, { nodeId: string; edgeId: string } | null>();
  const unused = new Set(nodes.map((n) => n.id));

  for (const node of nodes) {
    dist.set(node.id, Number.POSITIVE_INFINITY);
    prev.set(node.id, null);
  }
  dist.set(fromId, 0);

  while (unused.size > 0) {
    let u: string | null = null;
    let best = Number.POSITIVE_INFINITY;
    for (const id of unused) {
      const d = dist.get(id) ?? Number.POSITIVE_INFINITY;
      if (d < best) {
        best = d;
        u = id;
      }
    }
    if (u == null || best === Number.POSITIVE_INFINITY) break;
    unused.delete(u);
    if (u === toId) break;

    for (const neighbour of adj.get(u) ?? []) {
      if (!unused.has(neighbour.to)) continue;
      const alt = best + neighbour.cost;
      if (alt < (dist.get(neighbour.to) ?? Number.POSITIVE_INFINITY)) {
        dist.set(neighbour.to, alt);
        prev.set(neighbour.to, { nodeId: u, edgeId: neighbour.edgeId });
      }
    }
  }

  if ((dist.get(toId) ?? Number.POSITIVE_INFINITY) === Number.POSITIVE_INFINITY) {
    return null;
  }

  const nodeIds: string[] = [];
  const edgeIds: string[] = [];
  let cur: string | null = toId;
  while (cur) {
    nodeIds.unshift(cur);
    const p = prev.get(cur);
    if (!p) break;
    edgeIds.unshift(p.edgeId);
    cur = p.nodeId;
  }

  return {
    nodeIds,
    edgeIds,
    cost: dist.get(toId) ?? Number.POSITIVE_INFINITY,
  };
}

function buildSteps(
  nodeIds: string[],
  edgeIds: string[],
  nodesById: Map<string, RouteNode>,
  edgesById: Map<string, RouteEdge>,
): RouteStep[] {
  const steps: RouteStep[] = [];
  steps.push({
    order: 0,
    instruction: `Start at ${nodesById.get(nodeIds[0]!)?.label ?? "start"}.`,
    nodeId: nodeIds[0],
    level: nodesById.get(nodeIds[0]!)?.level,
  });

  for (let i = 0; i < edgeIds.length; i += 1) {
    const edge = edgesById.get(edgeIds[i]!);
    const nextNode = nodesById.get(nodeIds[i + 1]!);
    if (!edge || !nextNode) continue;
    let instruction = `Go to ${nextNode.label}`;
    if (nextNode.level) instruction += ` (level ${nextNode.level})`;
    if (edge.steps > 0) instruction += ` via ${edge.steps} step(s)`;
    if (edge.liftAvailable) instruction += " using the lift";
    if (edge.distanceMetres) instruction += ` — about ${Math.round(edge.distanceMetres)} m`;
    instruction += ".";
    steps.push({
      order: i + 1,
      instruction,
      nodeId: nextNode.id,
      edgeId: edge.id,
      level: nextNode.level,
      evidenceConfidence: edge.evidenceConfidence,
      distanceMetres: edge.distanceMetres,
    });
  }

  return steps;
}

function toAccessibleRoute(
  placeId: string,
  fromLabel: string,
  toLabel: string,
  path: PathResult,
  nodesById: Map<string, RouteNode>,
  edgesById: Map<string, RouteEdge>,
  rejected: Array<{ summary: string; reasons: string[] }>,
): AccessibleRoute {
  const totalDistance = path.edgeIds.reduce(
    (sum, id) => sum + (edgesById.get(id)?.distanceMetres ?? 0),
    0,
  );
  const avgConfidence =
    path.edgeIds.length === 0
      ? 1
      : path.edgeIds.reduce(
          (sum, id) => sum + (edgesById.get(id)?.evidenceConfidence ?? 0),
          0,
        ) / path.edgeIds.length;

  return {
    id: `route-${path.edgeIds.join("-") || "empty"}`,
    placeId,
    fromLabel,
    toLabel,
    nodeIds: path.nodeIds,
    edgeIds: path.edgeIds,
    totalDistanceMetres: Math.round(totalDistance * 10) / 10,
    estimatedAdditionalMinutes: Math.max(
      0,
      Math.round(totalDistance / 40 + (1 - avgConfidence) * 5),
    ),
    steps: buildSteps(path.nodeIds, path.edgeIds, nodesById, edgesById),
    segmentConfidence: path.edgeIds.map((edgeId) => ({
      edgeId,
      confidence: edgesById.get(edgeId)?.evidenceConfidence ?? 0,
    })),
    cost: Math.round(path.cost * 100) / 100,
    rejectedAlternatives: rejected,
  };
}

/**
 * Deterministic accessible route engine (Dijkstra on eligible edges).
 */
export function buildAccessibleRoute(input: RouteEngineInput): RouteEngineResult {
  const nodesById = new Map(input.nodes.map((n) => [n.id, n]));
  const edgesById = new Map(input.edges.map((e) => [e.id, e]));
  const blockedEdgeIds = activeBlockingEdgeIds(input.incidents);
  const outageLifts = liftOutageElementIds(input.incidents);
  const rejected: Array<{ summary: string; reasons: string[] }> = [];

  if (!nodesById.has(input.fromNodeId)) {
    throw new AccessIntelligenceError(
      "DESTINATION_NOT_FOUND",
      "Start location was not found in the access graph.",
      "Choose a known entrance or drop-off node.",
    );
  }
  if (!nodesById.has(input.toNodeId)) {
    throw new AccessIntelligenceError(
      "DESTINATION_NOT_FOUND",
      "Destination was not found in the access graph.",
      "Check the room or destination name and try again.",
    );
  }

  const eligible: Array<{ edge: RouteEdge; cost: number }> = [];

  for (const edge of input.edges) {
    const fromNode = nodesById.get(edge.fromNodeId);
    const toNode = nodesById.get(edge.toNodeId);
    const liftOutage =
      (fromNode?.elementId && outageLifts.has(fromNode.elementId)) ||
      (toNode?.elementId && outageLifts.has(toNode.elementId)) ||
      blockedEdgeIds.has(edge.id);

    const reasons = hardRequirementRejectionReasons(edge, input.passport, {
      liftOutage: Boolean(liftOutage && edge.liftAvailable),
    });

    if (blockedEdgeIds.has(edge.id) && !reasons.some((r) => /barrier|outage/i.test(r))) {
      reasons.push("Active incident blocks this route segment.");
    }

    if (reasons.length > 0) {
      rejected.push({
        summary: `Edge ${edge.id} (${fromNode?.label ?? edge.fromNodeId} → ${toNode?.label ?? edge.toNodeId})`,
        reasons,
      });
      continue;
    }

    const cost = calculateRouteCost(edge, input.passport).total;
    eligible.push({ edge, cost });
  }

  const path = dijkstra(input.nodes, eligible, input.fromNodeId, input.toNodeId);
  if (!path) {
    return {
      recommended: null,
      fallback: null,
      rejected,
    };
  }

  const fromLabel = nodesById.get(input.fromNodeId)?.label ?? "Start";
  const toLabel = nodesById.get(input.toNodeId)?.label ?? "Destination";

  const recommended = toAccessibleRoute(
    input.placeId,
    fromLabel,
    toLabel,
    path,
    nodesById,
    edgesById,
    rejected,
  );

  // Optional fallback: next-best by forcing higher uncertainty or excluding a critical edge
  let fallback: AccessibleRoute | null = null;
  if (path.edgeIds.length > 0) {
    const withoutPrimary = eligible.filter(
      (e) => !path.edgeIds.includes(e.edge.id) || path.edgeIds.length === 1,
    );
    // Try alternate by increasing cost on the first edge of primary path
    const altEligible = eligible.map(({ edge, cost }) => ({
      edge,
      cost: path.edgeIds[0] === edge.id ? cost + 1000 : cost,
    }));
    const altPath = dijkstra(
      input.nodes,
      altEligible,
      input.fromNodeId,
      input.toNodeId,
    );
    if (
      altPath &&
      altPath.edgeIds.join(",") !== path.edgeIds.join(",") &&
      withoutPrimary.length > 0
    ) {
      fallback = toAccessibleRoute(
        input.placeId,
        fromLabel,
        toLabel,
        altPath,
        nodesById,
        edgesById,
        [],
      );
    }
  }

  return { recommended, fallback, rejected };
}

export function assertEligibleRoute(result: RouteEngineResult): AccessibleRoute {
  if (!result.recommended) {
    throw new AccessIntelligenceError(
      "NO_ELIGIBLE_ROUTE",
      "No route satisfies the required access constraints.",
      "Review blockers, ask the venue to verify missing features, or adjust your passport requirements.",
      { rejected: result.rejected },
    );
  }
  return result.recommended;
}
