import type { AccessTwinRouteEdge, JsonObject } from "../types";

export function buildIndoorGraphEdges(
  rawEdges: JsonObject[],
): AccessTwinRouteEdge[] {
  return rawEdges.map((edge, index) => ({
    id: String(edge.id ?? `indoor-edge-${index}`),
    fromAssetId: String(edge.fromAssetId),
    toAssetId: String(edge.toAssetId),
    edgeType: "connects_to",
    direction: "directed",
    securityClassification: "public",
  }));
}
