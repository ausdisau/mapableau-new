/**
 * Deterministic Civic invariants enforced in Wave 1 services.
 */

export const CIVIC_INVARIANTS = [
  "Missing accessibility information remains unknown.",
  "Stale information remains stale.",
  "Conflicting evidence remains disputed.",
  "A vehicle marked accessible does not prove stop, pathway, curb, venue, or indoor accessibility.",
  "Imported geometry does not prove feature quality or current operation.",
  "Sensor silence does not mean an asset is operating.",
  "Telemetry failure does not count as uptime.",
  "Personal fit remains separate from baseline accessibility, legal compliance, reliability, civic equity, and service capacity.",
  "No universal civic accessibility score.",
  "No participant complexity, capacity, compliance, or worthiness score.",
  "Public planning simulations must expose assumptions, evidence coverage, affected synthetic journeys, unknowns, confidence, and limitations.",
  "Synthetic profiles are not prevalence estimates.",
  "Public maps must have list and text alternatives.",
  "Public information must show source and date.",
  "Paid organisations cannot improve evidence confidence, reliability, priority, public ranking, incident severity, or simulation results.",
  "Public incident information must not reveal participant journeys.",
  "AURA may explain and propose; it may not approve public expenditure, planning decisions, or emergency actions.",
  "Public officials and authorised humans retain planning authority.",
  "Physical-device action remains outside ordinary MapAble Civic.",
] as const;

export function assertNoUniversalScore(metadata: Record<string, unknown>): void {
  const forbiddenKeys = [
    "universalScore",
    "civicScore",
    "accessibilityScore",
    "dignityScore",
    "participantComplexityScore",
    "worthinessScore",
  ];
  for (const key of forbiddenKeys) {
    if (key in metadata) {
      throw new Error(`CIVIC_INVARIANT_VIOLATION:${key}`);
    }
  }
}

export function paidOrgCannotBoostConfidence(input: {
  isPaidBoost?: boolean;
}): void {
  if (input.isPaidBoost) {
    throw new Error("CIVIC_INVARIANT_VIOLATION:paid_confidence_boost");
  }
}
