import type { GaisAccessConditionEvent } from "@/lib/gais/conditions";
import { listAccessConditionsForGraph } from "@/lib/gais/conditions";

/**
 * Read-only Access Conditions for MapAble Go route context.
 * Does not alter route safety boundaries — informational only.
 */
export async function loadGoAccessConditions(
  graphId: string,
  activeAt?: Date,
): Promise<GaisAccessConditionEvent[]> {
  return listAccessConditionsForGraph(graphId, activeAt);
}

export function summarizeGoAccessConditions(events: GaisAccessConditionEvent[]): {
  count: number;
  labels: string[];
  hasLiftOutage: boolean;
  hasPathClosure: boolean;
} {
  return {
    count: events.length,
    labels: events.map((e) => e.label),
    hasLiftOutage: events.some((e) => e.eventType === "LIFT_OUTAGE"),
    hasPathClosure: events.some(
      (e) => e.eventType === "PATH_CLOSURE" || e.eventType === "OBSTRUCTION",
    ),
  };
}
