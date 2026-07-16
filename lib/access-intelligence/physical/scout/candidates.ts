import type { PerceptionCandidate } from "../schemas";
import { recordMetric } from "../observability";

const FICTIONAL_NOTICE =
  "Simulated perception candidate for Access Intelligence Scout — not live camera inference.";

const FIXTURES: Record<string, PerceptionCandidate[]> = {
  "fixture-harbour-corridor-3": [
    {
      id: "perc-corr-display",
      fixtureId: "fixture-harbour-corridor-3",
      label: "Temporary display stand",
      category: "obstruction",
      confidence: 0.82,
      boundingBox: { x: 0.35, y: 0.4, width: 0.2, height: 0.45 },
      summary: "Simulated obstruction narrowing Level 3 corridor clear width.",
      simulated: true,
      fictionalNotice: FICTIONAL_NOTICE,
    },
    {
      id: "perc-corr-signage",
      fixtureId: "fixture-harbour-corridor-3",
      label: "Wayfinding signage",
      category: "signage",
      confidence: 0.74,
      summary: "Simulated directional sign toward Room 3.12.",
      simulated: true,
      fictionalNotice: FICTIONAL_NOTICE,
    },
  ],
  "fixture-harbour-ent-b": [
    {
      id: "perc-door-closed",
      fixtureId: "fixture-harbour-ent-b",
      label: "Entrance B door closed",
      category: "door_state",
      confidence: 0.91,
      summary: "Simulated closed automatic door at Entrance B.",
      simulated: true,
      fictionalNotice: FICTIONAL_NOTICE,
    },
  ],
  "fixture-harbour-lift-west": [
    {
      id: "perc-lift-indicator",
      fixtureId: "fixture-harbour-lift-west",
      label: "Western lift floor indicator",
      category: "lift_indicator",
      confidence: 0.88,
      summary: "Simulated lift indicator showing cabin on ground floor.",
      simulated: true,
      fictionalNotice: FICTIONAL_NOTICE,
    },
  ],
  "fixture-harbour-room-312": [
    {
      id: "perc-room-glare",
      fixtureId: "fixture-harbour-room-312",
      label: "Window glare",
      category: "lighting",
      confidence: 0.67,
      summary: "Simulated glare condition near window seating.",
      simulated: true,
      fictionalNotice: FICTIONAL_NOTICE,
    },
  ],
};

/**
 * Return labelled simulated perception candidates for a Scout fixture.
 */
export function getScoutCandidates(fixtureId: string): PerceptionCandidate[] {
  const candidates = FIXTURES[fixtureId] ?? [];
  recordMetric("physical_scout_candidates", { fixtureId });
  return candidates.map((c) => ({ ...c }));
}

export function listScoutFixtureIds(): string[] {
  return Object.keys(FIXTURES);
}
