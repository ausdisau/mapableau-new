import type { MissionGraph, MissionNodeStatus } from "@/lib/ai/platform/missions/types";
import type { DependencyImpact, DependencyState, MapAbleMissionEvent } from "./types";

export function mapNodeStatusToDependencyState(status: MissionNodeStatus, eventFailed = false): DependencyState {
  if (eventFailed) return "failed";
  switch (status) {
    case "confirmed": case "available": return "healthy";
    case "needs_review": return "at_risk";
    case "missing": return "missing";
    case "not_authorised": return "not_authorised";
    case "consent_required": return "consent_required";
    case "disabled": return "disabled";
    case "unavailable": return "failed";
    default: { const _e: never = status; return _e; }
  }
}

function eventFailsNode(event: MapAbleMissionEvent, nodeId: string): boolean {
  if (!event.affectedNodeIds.includes(nodeId)) return false;
  return ["TRANSPORT_UNAVAILABLE","WORKER_CANCELLED","ACTION_FAILED","PROVIDER_CANCELLED","CONSENT_REVOKED"].includes(event.type);
}
function eventAtRiskNode(event: MapAbleMissionEvent, nodeId: string): boolean {
  if (!event.affectedNodeIds.includes(nodeId)) return false;
  return ["VENUE_ACCESS_CHANGED","EVIDENCE_STALE","DEADLINE_APPROACHING","PRICE_CHANGED"].includes(event.type);
}

export function analyseDependencyImpact(input: {
  graph: MissionGraph; events: MapAbleMissionEvent[]; previousStates?: Map<string, DependencyState>;
}): DependencyImpact[] {
  const impacts: DependencyImpact[] = [];
  const affectedIds = new Set(input.events.flatMap(e => e.affectedNodeIds));
  const hasSafeguarding = input.events.some(e => e.type === "SAFEGUARDING_SIGNAL");
  for (const node of input.graph.nodes) {
    const previousState = input.previousStates?.get(node.id) ?? mapNodeStatusToDependencyState(node.status);
    let currentState = mapNodeStatusToDependencyState(node.status);
    let reason = "No change detected.";
    for (const event of input.events) {
      if (eventFailsNode(event, node.id)) { currentState = "failed"; reason = `Failed due to ${event.type}`; break; }
      if (eventAtRiskNode(event, node.id) && (currentState === "healthy" || currentState === "missing")) {
        currentState = "at_risk"; reason = `At risk due to ${event.type}`;
      }
    }
    if (hasSafeguarding && (affectedIds.has(node.id) || node.type === "human_review")) {
      currentState = "human_review"; reason = "Safeguarding signal — human review required";
    }
    const preserved = !affectedIds.has(node.id) && currentState === previousState;
    if (currentState === "missing" && previousState !== "missing" && previousState !== "not_authorised" && previousState !== "consent_required" && previousState !== "disabled") {
      currentState = "recovery_available"; reason = "Recovery options may be available";
    }
    impacts.push({ nodeId: node.id, label: node.label, previousState, currentState, preserved, reason });
  }
  return impacts;
}

export function getAtRiskNodeIds(impacts: DependencyImpact[]): string[] {
  return impacts.filter(i => ["at_risk","failed","blocked","human_review"].includes(i.currentState)).map(i => i.nodeId);
}
export function getPreservedNodeIds(impacts: DependencyImpact[]): string[] {
  return impacts.filter(i => i.preserved).map(i => i.nodeId);
}
export function traverseDependencies(graph: MissionGraph, startNodeIds: string[]): string[] {
  const visited = new Set<string>(); const queue = [...startNodeIds];
  while (queue.length) {
    const id = queue.shift()!; if (visited.has(id)) continue; visited.add(id);
    for (const edge of graph.edges) {
      if (edge.fromId === id && edge.dependencyKind === "requires") queue.push(edge.toId);
      if (edge.toId === id && edge.dependencyKind === "blocks") queue.push(edge.fromId);
    }
  }
  return [...visited];
}
