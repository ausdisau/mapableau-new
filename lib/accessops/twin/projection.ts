import type { AccessOperationalState } from "@prisma/client";

import { isOperationallyAvailable } from "../status/freshness";
import type {
  AccessRouteConstraints,
  AccessTwinRouteEdge,
  OperationalStatusProjection,
} from "../types";
import { isRestrictedClassification } from "../types";

function edgeMatchesConstraints(
  edge: AccessTwinRouteEdge,
  constraints: AccessRouteConstraints = {},
): boolean {
  if (constraints.hardBlockedAssetIds?.includes(edge.toAssetId)) return false;
  if (constraints.requiresWheelchairAccess && edge.toAssetType === "stair")
    return false;
  if (
    constraints.maximumGradient !== undefined &&
    edge.maximumGradient !== null &&
    edge.maximumGradient !== undefined &&
    edge.maximumGradient > constraints.maximumGradient
  ) {
    return false;
  }
  if (
    constraints.minimumClearance !== undefined &&
    edge.minimumClearance !== null &&
    edge.minimumClearance !== undefined &&
    edge.minimumClearance < constraints.minimumClearance
  ) {
    return false;
  }
  return true;
}

export function canRouteThroughAsset(
  status:
    | Pick<OperationalStatusProjection, "state" | "available" | "stale">
    | AccessOperationalState,
  edge: AccessTwinRouteEdge,
  constraints: AccessRouteConstraints = {},
): boolean {
  if (isRestrictedClassification(edge.securityClassification)) return false;
  if (isRestrictedClassification(edge.toSecurityClassification)) return false;
  if (
    edge.toPublicVisibility === "restricted" ||
    edge.toPublicVisibility === "never_public"
  )
    return false;
  const available =
    typeof status === "string"
      ? isOperationallyAvailable(status)
      : status.available && !status.stale;
  if (!available) return false;
  return edgeMatchesConstraints(edge, constraints);
}

export function projectRoutableEdges(
  edges: AccessTwinRouteEdge[],
  statusByAsset: Map<string, OperationalStatusProjection>,
  constraints: AccessRouteConstraints = {},
  now: Date = new Date(),
): AccessTwinRouteEdge[] {
  return edges.filter((edge) => {
    if (edge.validUntil && edge.validUntil.getTime() <= now.getTime())
      return false;
    const status = statusByAsset.get(edge.toAssetId) ?? {
      assetId: edge.toAssetId,
      state: "stale",
      available: false,
      stale: true,
      sourceType: null,
      confidence: 0,
      effectiveFrom: null,
      expectedUntil: null,
      freshnessDeadline: null,
      reason: "missing_status_updates",
    };
    return canRouteThroughAsset(status, edge, constraints);
  });
}
