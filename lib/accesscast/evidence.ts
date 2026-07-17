import type { AccessEvidenceClass } from "@/lib/access-intelligence-next";

import type { AccessCastEvidenceRef, AccessCastForecastHorizon } from "./types";

/** Feature-specific freshness windows (hours) for AccessCast critical ops evidence. */
export const ACCESSCAST_FRESHNESS_HOURS: Record<string, number> = {
  "physical.lift_operational": 24,
  "transport.accessible_vehicle": 24,
  "physical.accessible_toilet": 24 * 180,
  "physical.minimum_clear_width_mm": 24 * 730,
  "physical.step_free": 24 * 365,
  temporary_obstruction: 24,
  event_layout: 24,
};

/**
 * Evidence classes that may never independently create temporarily_unavailable
 * or block a hard requirement without corroboration.
 */
export const NON_BLOCKING_ALONE_EVIDENCE_CLASSES: ReadonlySet<AccessEvidenceClass> = new Set([
  "model_candidate",
  "device_assisted_estimate",
  "synthetic_fixture",
]);

export function isEvidenceFresh(
  evidence: AccessCastEvidenceRef,
  asOfIso: string,
  conceptId?: string,
): boolean {
  if (evidence.freshUntil) {
    return new Date(evidence.freshUntil).getTime() >= new Date(asOfIso).getTime();
  }
  const concept = conceptId ?? evidence.ontologyConceptId;
  if (!concept) return true;
  const hours = ACCESSCAST_FRESHNESS_HOURS[concept];
  if (hours == null) return true;
  const ageMs = new Date(asOfIso).getTime() - new Date(evidence.observedAt).getTime();
  return ageMs <= hours * 60 * 60 * 1000;
}

export function resolveHorizon(
  intendedJourneyTime: string,
  asOfIso: string,
): AccessCastForecastHorizon {
  const deltaMs = new Date(intendedJourneyTime).getTime() - new Date(asOfIso).getTime();
  const hours = deltaMs / (60 * 60 * 1000);
  if (hours <= 0.5) return "nowcast";
  if (hours <= 4) return "near_term";
  if (hours <= 24) return "day_outlook";
  if (hours <= 24 * 14) return "planning_outlook";
  return "long_range";
}

export function defaultConfidenceHorizon(
  intendedJourneyTime: string,
  horizon: AccessCastForecastHorizon,
): string {
  const intended = new Date(intendedJourneyTime);
  switch (horizon) {
    case "nowcast":
      return new Date(intended.getTime() - 15 * 60 * 1000).toISOString();
    case "near_term":
      return new Date(intended.getTime() - 30 * 60 * 1000).toISOString();
    case "day_outlook":
      return new Date(intended.getTime() - 60 * 60 * 1000).toISOString();
    case "planning_outlook":
      return new Date(intended.getTime() - 12 * 60 * 60 * 1000).toISOString();
    case "long_range":
      return intended.toISOString();
    default: {
      const _exhaustive: never = horizon;
      return _exhaustive;
    }
  }
}

export function defaultForecastExpiry(
  generatedAt: string,
  horizon: AccessCastForecastHorizon,
): string {
  const base = new Date(generatedAt).getTime();
  const hours =
    horizon === "nowcast"
      ? 0.5
      : horizon === "near_term"
        ? 2
        : horizon === "day_outlook"
          ? 6
          : horizon === "planning_outlook"
            ? 24
            : 24;
  return new Date(base + hours * 60 * 60 * 1000).toISOString();
}
