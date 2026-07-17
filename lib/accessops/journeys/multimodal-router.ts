import { findRouteBfs } from "../twin/twin-service";
import type {
  AccessRouteConstraints,
  AccessRouteResult,
  AccessTwinRouteEdge,
} from "../types";

export function routeMultimodalJourney(
  edges: AccessTwinRouteEdge[],
  fromAssetId: string,
  toAssetId: string,
  constraints: AccessRouteConstraints,
): AccessRouteResult {
  return findRouteBfs(edges, fromAssetId, toAssetId, constraints);
}
