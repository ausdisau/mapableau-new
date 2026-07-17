import { resolveSegmentReliability } from "../reliability/evaluate";
import type { AccessReliabilityBand } from "../reliability/types";
import type { AccessConclusionState } from "../results/states";
import { runDoorToRoomPreflight } from "./door-to-room-preflight";
import type { AccessQueryAst } from "../query/ast";
import type {
  JourneyDependencyEdge,
  JourneyDependencyGraph,
  JourneyDependencyNode,
  JourneySegment,
} from "./segments";

export type JourneyFailureImpactLevel =
  | "none"
  | "degraded"
  | "blocked"
  | "unknown_impact";

export type JourneyFailureNode = JourneyDependencyNode & {
  assetId: string | null;
  reliabilityBand: AccessReliabilityBand;
  impactIfFailed: JourneyFailureImpactLevel;
  timingConflict: boolean;
  authorityGap: boolean;
  acceptedHandoff: boolean | null;
};

export type JourneyFailureEdge = JourneyDependencyEdge & {
  critical: boolean;
};

export type JourneyFailureGraph = {
  graphId: string;
  queryId: string;
  destinationRef: string;
  nodes: JourneyFailureNode[];
  edges: JourneyFailureEdge[];
  singlePointsOfFailure: string[];
  unverifiedFallbacks: string[];
  hardDependencies: string[];
  optionalDependencies: string[];
  staleEvidenceNodes: string[];
  timingConflicts: string[];
  authorityGaps: string[];
  unacceptedHandoffs: string[];
  overallFragility: "low" | "moderate" | "high" | "unknown";
  overallConclusion: AccessConclusionState;
  listAlternative: Array<{
    id: string;
    label: string;
    status: JourneyFailureNode["status"];
    hard: boolean;
    reliabilityBand: AccessReliabilityBand;
    impactIfFailed: JourneyFailureImpactLevel;
  }>;
  limitations: string[];
  operatingMode: "synthetic" | "shadow";
  productionClaim: "none";
};

const SEGMENT_ASSET: Record<string, string | null> = {
  "seg-origin": null,
  "seg-stop": "harbour_civic.stop_ferry",
  "seg-curb": null,
  "seg-external": null,
  "seg-entrance": "harbour_civic.entrance_west",
  "seg-lift": "harbour_civic.lift_a",
  "seg-corridor": null,
  "seg-room": "harbour_civic.toilet_l3",
  "seg-return": null,
};

function impactForSegment(segment: JourneySegment): JourneyFailureImpactLevel {
  if (!segment.hardDependency) return "degraded";
  if (
    segment.personalFit === "incompatible" ||
    segment.personalFit === "blocked_by_hard_requirement"
  ) {
    return "blocked";
  }
  if (
    segment.personalFit === "cannot_confirm" ||
    segment.personalFit === "operational_status_unknown" ||
    segment.operationalState === "unknown" ||
    segment.operationalState === "stale"
  ) {
    return "unknown_impact";
  }
  return segment.hardDependency ? "blocked" : "degraded";
}

function fragilityFromGraph(
  nodes: JourneyFailureNode[],
  singlePoints: string[],
): JourneyFailureGraph["overallFragility"] {
  if (singlePoints.length >= 2) return "high";
  if (singlePoints.length === 1) return "high";
  const unknownHard = nodes.filter((n) => n.hard && n.status === "unknown");
  if (unknownHard.length > 0) return "moderate";
  const failed = nodes.some((n) => n.status === "failed");
  if (failed) return "high";
  return "unknown";
}

/**
 * Build a journey failure / fragility graph from door-to-room preflight.
 * Does not predict participant behaviour. Does not execute recovery.
 */
export function buildJourneyFailureGraph(input: {
  query: AccessQueryAst;
  requirementSetRef: string;
}): JourneyFailureGraph {
  const { preflight } = runDoorToRoomPreflight(input);
  const base = preflight.dependencyGraph;
  const nodes: JourneyFailureNode[] = base.nodes.map((n) => {
    const segment = preflight.segments.find((s) => s.id === n.segmentId)!;
    const assetId = SEGMENT_ASSET[segment.id] ?? null;
    const reliability = resolveSegmentReliability(assetId);
    const authorityGap =
      segment.confirmationRequired &&
      (segment.responsibleOrganisation === "multi" ||
        segment.operationalState === "unknown");
    const timingConflict = segment.kind === "return_journey" && !preflight.returnJourneyEvaluated;

    return {
      ...n,
      assetId,
      reliabilityBand: reliability.band,
      impactIfFailed: impactForSegment(segment),
      timingConflict,
      authorityGap,
      acceptedHandoff: segment.kind === "accessible_transport" ? null : null,
    };
  });

  const edges: JourneyFailureEdge[] = base.edges.map((e) => {
    const to = nodes.find((n) => n.id === e.to);
    return {
      ...e,
      critical: Boolean(to?.hard),
    };
  });

  const hardDependencies = nodes.filter((n) => n.hard).map((n) => n.label);
  const optionalDependencies = nodes.filter((n) => !n.hard).map((n) => n.label);
  const staleEvidenceNodes = preflight.segments
    .filter((s) => s.operationalState === "stale" || s.operationalState === "expired")
    .map((s) => s.label);
  const timingConflicts = nodes.filter((n) => n.timingConflict).map((n) => n.label);
  const authorityGaps = nodes.filter((n) => n.authorityGap).map((n) => n.label);
  const unacceptedHandoffs = nodes
    .filter((n) => n.acceptedHandoff === false)
    .map((n) => n.label);

  const singlePointsOfFailure = [...base.singlePointsOfFailure];
  // Lift with cannot_forecast + unverified fallback is always a SPOF in Harbour fixture
  if (
    nodes.some(
      (n) =>
        n.assetId === "harbour_civic.lift_a" &&
        (n.reliabilityBand === "cannot_forecast" || n.status === "unknown"),
    ) &&
    !singlePointsOfFailure.some((s) => /lift/i.test(s))
  ) {
    singlePointsOfFailure.push("Lift A");
  }

  return {
    graphId: `failure:${input.query.id}`,
    queryId: input.query.id,
    destinationRef: preflight.destinationRef,
    nodes,
    edges,
    singlePointsOfFailure,
    unverifiedFallbacks: base.unverifiedFallbacks,
    hardDependencies,
    optionalDependencies,
    staleEvidenceNodes,
    timingConflicts,
    authorityGaps,
    unacceptedHandoffs,
    overallFragility: fragilityFromGraph(nodes, singlePointsOfFailure),
    overallConclusion: preflight.overallConclusion,
    listAlternative: nodes.map((n) => ({
      id: n.id,
      label: n.label,
      status: n.status,
      hard: n.hard,
      reliabilityBand: n.reliabilityBand,
      impactIfFailed: n.impactIfFailed,
    })),
    limitations: [
      "Failure graph is synthetic and does not predict participant behaviour",
      "A route found is not a journey completed",
      "cannot_forecast must not be read as generally_reliable",
      "No ContinuityOS recovery actions are executed",
      ...preflight.limitations.slice(0, 3),
    ],
    operatingMode: "synthetic",
    productionClaim: "none",
  };
}

/** Re-export base dependency graph builder access for tests. */
export type { JourneyDependencyGraph };
