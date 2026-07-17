import {
  buildStartingWorkDependencyGraph,
  type JourneyDependencyNode,
} from "@/lib/pilot/starting-work/dependency-graph";

import type {
  MissionDependencyDomain,
  MissionDependencyNodeProjection,
  MissionDependencyProjection,
  MissionDependencyState,
} from "./vocabulary";

const KIND_TO_DOMAIN: Record<JourneyDependencyNode["kind"], MissionDependencyDomain> =
  {
    participant_goal: "participant_goal",
    communication_passport: "communication_passport",
    worker_readiness: "worker_readiness",
    care_shift: "care",
    transport_quote: "transport_quote",
    transport_trip: "transport_trip",
    venue_entrance: "venue_access",
    indoor_route: "indoor_route",
    equipment: "equipment",
    billing_evidence: "billing_evidence",
    return_journey: "return_journey",
    outcome_review: "outcome",
    visit_pack: "visit_pack",
  };

function mapState(
  state: JourneyDependencyNode["state"],
): MissionDependencyState {
  return state;
}

function toNode(node: JourneyDependencyNode): MissionDependencyNodeProjection {
  const hard =
    node.kind === "participant_goal" ||
    node.kind === "communication_passport" ||
    node.kind === "care_shift" ||
    node.kind === "transport_trip" ||
    node.kind === "equipment";

  return {
    id: node.id,
    domain: KIND_TO_DOMAIN[node.kind],
    label: node.label,
    state: mapState(node.state),
    sourceRecordRef: node.entityRef,
    hardRequirement: hard,
    freshness: node.state === "unknown" ? "unknown" : "current",
  };
}

/**
 * Build a shared MissionDependencyProjection from Starting Work journey state.
 * Read-only adapter — does not write Care, Transport, or Billing.
 */
export function projectStartingWorkDependencies(input: {
  journeyId: string;
  blocked: boolean;
  failureMode?: string;
  stepsCompleted: string[];
  participantGoal?: string;
}): MissionDependencyProjection {
  const graph = buildStartingWorkDependencyGraph(input);

  return {
    projectionKey: `starting_work:${input.journeyId}`,
    vertical: "employment_starting_work",
    templateKey: "pilot.starting_work",
    participantGoal:
      input.participantGoal ??
      "Start new job at Harbour Civic Centre with accessible support",
    nodes: graph.nodes.map(toNode),
    edges: graph.edges.map((e) => ({
      from: e.from,
      to: e.to,
      relation: e.relation,
    })),
    writersInvoked: [],
    productionClaim: "none",
  };
}

/** Hard dependencies that are blocked or unknown — participant action surfaces. */
export function listBlockedHardDependencies(
  projection: MissionDependencyProjection,
): MissionDependencyNodeProjection[] {
  return projection.nodes.filter(
    (n) =>
      n.hardRequirement &&
      (n.state === "blocked" ||
        n.state === "unknown" ||
        n.state === "recovery_required"),
  );
}
