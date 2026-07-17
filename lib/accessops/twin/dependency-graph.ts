import type { AccessTwinRouteEdge } from "../types";

export interface DependencyImpact {
  assetId: string;
  blockedDependants: string[];
}

export function buildDependencyGraph(
  edges: AccessTwinRouteEdge[],
): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.edgeType !== "depends_on" && edge.edgeType !== "required_for")
      continue;
    const list = graph.get(edge.fromAssetId) ?? [];
    list.push(edge.toAssetId);
    graph.set(edge.fromAssetId, list);
  }
  return graph;
}

export function findBlockedDependants(
  graph: Map<string, string[]>,
  failedAssetId: string,
): DependencyImpact {
  const blocked = new Set<string>();
  const queue = [...(graph.get(failedAssetId) ?? [])];
  while (queue.length > 0) {
    const assetId = queue.shift();
    if (!assetId || blocked.has(assetId)) continue;
    blocked.add(assetId);
    queue.push(...(graph.get(assetId) ?? []));
  }
  return { assetId: failedAssetId, blockedDependants: [...blocked] };
}
