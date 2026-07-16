/**
 * System 5 — Temporary event accessibility planning.
 * Distinct from permanent AccessPlace baseline and from emergency evacuation certification.
 */

import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";
import {
  generateSyntheticBuilding,
  runRegressionAgainstBuilding,
  SYNTHETIC_PASSPORTS,
} from "@/lib/access-intelligence/regression";

export const EVENT_TYPES = [
  "festival",
  "conference",
  "concert",
  "market",
  "exhibition",
  "community_event",
  "sporting_event",
  "university_orientation",
  "voting_location",
  "pop_up_service_centre",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_LIFECYCLE = [
  "intake",
  "site_graph",
  "evidence_collection",
  "design_review",
  "personal_fit_simulations",
  "access_coverage",
  "unresolved_questions",
  "pre_event_inspection",
  "guide_publication",
  "staff_briefing",
  "event_day_operations",
  "post_event_review",
  "reusable_lessons",
] as const;

export type TemporaryGraph = {
  elements: Array<{ id: string; type: string; name: string; attributes?: Record<string, unknown> }>;
  edges: Array<{
    id: string;
    fromElementId: string;
    toElementId: string;
    widthMm?: number;
    blocked?: boolean;
  }>;
};

export function createEmptyTemporaryGraph(): TemporaryGraph {
  return { elements: [], edges: [] };
}

export function simulateEventPassports(graph: TemporaryGraph): {
  blockedRoutes: string[];
  suggestions: string[];
  unresolvedQuestions: string[];
} {
  const blockedRoutes = graph.edges
    .filter((e) => e.blocked || (e.widthMm != null && e.widthMm < 850))
    .map((e) => e.id);

  const suggestions = blockedRoutes.map(
    (id) => `Widen or re-route temporary edge ${id}; publish updated event guide.`,
  );

  const unresolvedQuestions: string[] = [];
  if (!graph.elements.some((e) => e.type === "accessible_toilet")) {
    unresolvedQuestions.push("No temporary accessible toilet element modelled.");
  }
  if (!graph.elements.some((e) => e.type === "quiet_zone")) {
    unresolvedQuestions.push("Quiet zone not specified.");
  }

  // Reuse synthetic passport runner against a stand-in building derived from graph size.
  const building = generateSyntheticBuilding("event_venue", `edges-${graph.edges.length}`);
  if (blockedRoutes.length) {
    building.features = building.features.map((f) =>
      f.featureType === "step_free" ? { ...f, value: false } : f,
    );
  }
  const { findings } = runRegressionAgainstBuilding(building);
  for (const f of findings) {
    if (f.code === "unexpected_decision" || f.code === "new_blocker") {
      suggestions.push(f.summary);
    }
  }

  void SYNTHETIC_PASSPORTS;
  return { blockedRoutes, suggestions, unresolvedQuestions };
}

export function assertNotEvacuationPlan(label: string): void {
  if (/evacuat|fire\s*egress|emergency\s*exit\s*cert/i.test(label)) {
    throw new Error(
      "Temporary access planning must not be conflated with an approved emergency evacuation plan.",
    );
  }
}

export function assertTemporaryEventPlannerEnabled(): void {
  if (!accessIntelligenceFlags.temporaryEventPlanner) {
    throw new Error("Temporary event planner disabled.");
  }
}
