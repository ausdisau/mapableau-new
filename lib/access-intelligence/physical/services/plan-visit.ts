import { calculatePersonalFit } from "../../fit-engine";
import {
  buildHarbourLivingTwin,
  HARBOUR_PLACE_ID,
} from "../../living/harbour-civic";
import { getAccessStateAt } from "../../living/temporal";
import { buildAccessibleRoute } from "../../route-engine";
import type { AccessPassport } from "../../schemas";
import { listHarbourCapabilities } from "../capabilities/harbour";
import { getPhysicalMode } from "../configuration";
import { recordMetric } from "../observability";
import type { PhysicalAccessResponse } from "../schemas";
import {
  getHarbourPhysicalSimulator,
  type HarbourPhysicalSimulator,
} from "../simulator/harbour-simulator";

export type PhysicalVisitJourney = {
  fromNodeId?: string;
  toNodeId?: string;
  destinationLabel?: string;
  visitAt?: string;
};

export type PlanPhysicalVisitResult = PhysicalAccessResponse & {
  rejectedRouteSummaries: Array<{ summary: string; reasons: string[] }>;
};

/**
 * Plan a fictional Harbour visit using fit + route engines and live simulator twin.
 */
export function planPhysicalVisit(
  passport: AccessPassport,
  journey: PhysicalVisitJourney = {},
  simulator?: HarbourPhysicalSimulator,
): PlanPhysicalVisitResult {
  const sim = simulator ?? getHarbourPhysicalSimulator();
  const state = sim.getState();
  const twin = state.twin ?? buildHarbourLivingTwin();
  const visitAt = journey.visitAt ?? new Date().toISOString();
  const accessAt = getAccessStateAt(twin, visitAt);

  const decision = calculatePersonalFit({
    place: twin.place,
    passport,
    features: accessAt.effectiveFeatures,
    evidence: twin.evidence,
    incidents: accessAt.activeIncidents,
  });

  const fromNodeId = journey.fromNodeId ?? "n-hcc-drop";
  const toNodeId =
    journey.toNodeId ??
    twin.destinations.find((d) => d.id === "dest-room-312")?.nodeId ??
    "n-hcc-room";

  const routeResult = buildAccessibleRoute({
    placeId: HARBOUR_PLACE_ID,
    nodes: twin.nodes,
    edges: accessAt.effectiveEdges,
    passport,
    fromNodeId,
    toNodeId,
    incidents: accessAt.activeIncidents,
  });

  const capabilities = listHarbourCapabilities({
    mainLiftOutage: state.mainLiftOutage,
    doorEntBFault: state.doorEntBFault,
    emergencyActive: state.emergency.active,
    devices: state.devices,
  }).filter((c) => c.enabled);

  const response: PlanPhysicalVisitResult = {
    placeId: HARBOUR_PLACE_ID,
    mode: getPhysicalMode(),
    decision: {
      ...decision,
      recommendedRouteId: routeResult.recommended?.id ?? null,
      conditions: [
        ...decision.conditions,
        ...accessAt.notes.filter((n) => !n.includes("fictional")),
      ],
    },
    route: routeResult.recommended,
    fallbackRoute: routeResult.fallback,
    availableCapabilities: capabilities,
    devices: state.devices,
    emergency: state.emergency,
    observations: state.observations,
    fictionalNotice: twin.fictionalNotice,
    generatedAt: new Date().toISOString(),
    rejectedRouteSummaries: routeResult.rejected,
  };

  recordMetric("physical_visit_planned", { placeId: HARBOUR_PLACE_ID });
  return response;
}
