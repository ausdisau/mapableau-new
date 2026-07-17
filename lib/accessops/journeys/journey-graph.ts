import type { AccessTwinRouteEdge } from "../types";

export function excludeBlockedAssets(
  edges: AccessTwinRouteEdge[],
  blockedAssetIds: string[],
): AccessTwinRouteEdge[] {
  const blocked = new Set(blockedAssetIds);
  return edges.filter(
    (edge) => !blocked.has(edge.fromAssetId) && !blocked.has(edge.toAssetId),
  );
}
