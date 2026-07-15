export {
  calculateEvidenceConfidence,
  type ConfidenceInput,
  type ConfidenceResult,
} from "../confidence-engine";

import type { LiveIncident } from "../schemas";

/** Live reliability 0–100 from active incidents (independent of baseline accreditation). */
export function calculateLiveReliability(
  incidents: LiveIncident[] | undefined,
): { liveReliability: number; activeDescriptions: string[] } {
  const active = (incidents ?? []).filter((i) => i.status === "active");
  if (active.length === 0) {
    return { liveReliability: 95, activeDescriptions: [] };
  }
  const activeDescriptions = active.map((i) => i.description);
  const liveReliability = Math.max(
    20,
    95 -
      active.length * 15 -
      (active.some((i) => i.severity === "critical" || i.severity === "high")
        ? 20
        : 0),
  );
  return { liveReliability, activeDescriptions };
}
