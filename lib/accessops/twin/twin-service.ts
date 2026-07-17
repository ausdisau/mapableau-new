import type { AccessAsset, AccessTwinEdge } from "@prisma/client";

import type {
  AccessRouteConstraints,
  AccessRouteResult,
  AccessTwinRouteEdge,
} from "../types";

import { toTwinNode } from "./twin-node";

export function buildDirectionalEdges(
  edges: AccessTwinRouteEdge[],
): AccessTwinRouteEdge[] {
  return edges.flatMap((edge) => {
    if (edge.direction === "directed") return [edge];
    return [
      edge,
      {
        ...edge,
        id: `${edge.id}:reverse`,
        fromAssetId: edge.toAssetId,
        toAssetId: edge.fromAssetId,
      },
    ];
  });
}

export function findRouteBfs(
  edges: AccessTwinRouteEdge[],
  startAssetId: string,
  endAssetId: string,
  constraints: AccessRouteConstraints = {},
): AccessRouteResult {
  const blocked = new Set(constraints.hardBlockedAssetIds ?? []);
  const adjacency = new Map<string, AccessTwinRouteEdge[]>();
  for (const edge of buildDirectionalEdges(edges)) {
    if (blocked.has(edge.toAssetId)) continue;
    const list = adjacency.get(edge.fromAssetId) ?? [];
    list.push(edge);
    adjacency.set(edge.fromAssetId, list);
  }

  const visited = new Set<string>([startAssetId]);
  const queue: { assetIds: string[]; edgeIds: string[] }[] = [
    { assetIds: [startAssetId], edgeIds: [] },
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    const tail = current.assetIds[current.assetIds.length - 1];
    if (tail === endAssetId) return { found: true, ...current, warnings: [] };
    for (const edge of adjacency.get(tail) ?? []) {
      if (visited.has(edge.toAssetId)) continue;
      visited.add(edge.toAssetId);
      queue.push({
        assetIds: [...current.assetIds, edge.toAssetId],
        edgeIds: [...current.edgeIds, edge.id],
      });
    }
  }
  return {
    found: false,
    assetIds: [],
    edgeIds: [],
    warnings: ["route_not_found"],
  };
}

export function projectTwinAssets(
  assets: AccessAsset[],
): ReturnType<typeof toTwinNode>[] {
  return assets
    .map(toTwinNode)
    .filter((node): node is NonNullable<typeof node> => node !== null);
}

export function projectTwinEdges(edges: AccessTwinEdge[]): AccessTwinEdge[] {
  return edges.filter(
    (edge) =>
      edge.securityClassification === "public" ||
      edge.securityClassification === "internal",
  );
}
