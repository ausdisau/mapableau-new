/**
 * Portfolio maturity labels (honest productisation vocabulary).
 * Distinct from ConvergenceCapabilityMaturity Prisma enum — mapped in registry docs.
 */
export const MISSION_MATURITY_STATES = [
  "concept",
  "scaffold",
  "synthetic_demo",
  "internal_alpha",
  "controlled_pilot",
  "limited_release",
  "production_supported",
  "suspended",
  "retired",
] as const;

export type MissionMaturityState = (typeof MISSION_MATURITY_STATES)[number];

export function assertMissionMaturity(value: string): MissionMaturityState {
  if ((MISSION_MATURITY_STATES as readonly string[]).includes(value)) {
    return value as MissionMaturityState;
  }
  throw new Error(`Unknown mission maturity: ${value}`);
}
