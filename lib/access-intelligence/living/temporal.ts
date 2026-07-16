import type { AccessFeature, LiveIncident, RouteEdge } from "../schemas";

import type { LivingAccessTwin, TemporalRule } from "./schemas";

export type AccessStateAt = {
  visitAt: string;
  localHour: number;
  activeIncidents: LiveIncident[];
  closedElementIds: string[];
  closedEdgeIds: string[];
  unavailableLiftElementIds: string[];
  effectiveEdges: RouteEdge[];
  effectiveFeatures: AccessFeature[];
  notes: string[];
};

function localHourFromIso(visitAt: string): number {
  const d = new Date(visitAt);
  // Demo buildings use Australia/Sydney wall-clock approximation via UTC+10 offset for determinism
  const sydney = new Date(d.getTime() + 10 * 60 * 60 * 1000);
  return sydney.getUTCHours();
}

function ruleApplies(rule: TemporalRule, localHour: number, visitAt: string): boolean {
  if (rule.startsAt && visitAt < rule.startsAt) return false;
  if (rule.endsAt && visitAt > rule.endsAt) return false;
  if (typeof rule.closesAfterHourLocal === "number") {
    return localHour >= rule.closesAfterHourLocal;
  }
  if (typeof rule.opensAtHourLocal === "number") {
    return localHour < rule.opensAtHourLocal;
  }
  return rule.effect.available === false;
}

/**
 * Combine baseline twin evidence with operating rules and incidents at a visit time.
 */
export function getAccessStateAt(
  twin: LivingAccessTwin,
  visitAt: string,
): AccessStateAt {
  const localHour = localHourFromIso(visitAt);
  const notes: string[] = [twin.fictionalNotice];
  const closedElementIds = new Set<string>();
  const closedEdgeIds = new Set<string>();

  for (const rule of twin.operatingRules) {
    if (!ruleApplies(rule, localHour, visitAt)) continue;
    if (rule.elementId) closedElementIds.add(rule.elementId);
    for (const edgeId of rule.edgeIds) closedEdgeIds.add(edgeId);
    notes.push(rule.effect.note);
  }

  const now = new Date(visitAt).getTime();
  const activeIncidents = twin.incidents.filter((inc) => {
    if (inc.status === "resolved" || inc.status === "expired") return false;
    if (inc.expiresAt && new Date(inc.expiresAt).getTime() <= now) return false;
    return inc.status === "active" || inc.status === "unverified";
  });

  const unavailableLiftElementIds = new Set<string>();
  for (const inc of activeIncidents) {
    for (const edgeId of inc.affectedEdgeIds) closedEdgeIds.add(edgeId);
    if (inc.type === "lift_outage" && inc.elementId) {
      unavailableLiftElementIds.add(inc.elementId);
    }
    if (inc.type === "locked_entrance" && inc.elementId) {
      closedElementIds.add(inc.elementId);
    }
    notes.push(`Incident: ${inc.description}`);
  }

  const effectiveEdges = twin.edges.map((edge) => {
    if (closedEdgeIds.has(edge.id)) {
      return { ...edge, temporaryBarrier: true, liftAvailable: false };
    }
    return edge;
  });

  const effectiveFeatures = twin.features.map((f) => {
    if (f.elementId && closedElementIds.has(f.elementId) && f.featureType === "step_free") {
      return {
        ...f,
        value: false,
        notes: `${f.notes ?? ""} Closed at visit time.`.trim(),
      };
    }
    if (
      f.elementId &&
      unavailableLiftElementIds.has(f.elementId) &&
      f.featureType === "lift"
    ) {
      return { ...f, value: false, notes: "Lift unavailable due to live incident." };
    }
    return f;
  });

  return {
    visitAt,
    localHour,
    activeIncidents,
    closedElementIds: [...closedElementIds],
    closedEdgeIds: [...closedEdgeIds],
    unavailableLiftElementIds: [...unavailableLiftElementIds],
    effectiveEdges,
    effectiveFeatures,
    notes,
  };
}
