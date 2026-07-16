/** Routing package boundary — TypeScript graph today; PostGIS-ready tomorrow. */
export {
  buildAccessibleRoute,
  assertEligibleRoute,
  type RouteEngineInput,
  type RouteEngineResult,
} from "../route-engine";
export {
  calculateRouteCost,
  hardRequirementRejectionReasons,
  type RouteCostBreakdown,
} from "../route-cost";
export { routeCostWeights } from "../configuration";
