export const startingWorkPilotConfig = {
  get enabled() {
    return process.env.MAPABLE_STARTING_WORK_PILOT_ENABLED === "true";
  },
  /** Synthetic Harbour Civic Centre fixtures only unless explicitly authorised. */
  get syntheticOnly() {
    return process.env.MAPABLE_STARTING_WORK_SYNTHETIC_ONLY !== "false";
  },
  /** Persist StartingWorkJourneyProjection (default off). */
  get dbPersistence() {
    return process.env.MAPABLE_STARTING_WORK_DB_PERSISTENCE_ENABLED === "true";
  },
  authorityCeiling: "SYNTHETIC_PILOT_ONLY" as const,
  productionClaimStatus: "not_claimable" as const,
  maturity: "controlled_pilot" as const,
  /** Honesty: simulation ≠ live booking / CareOSMission SoR. */
  isLiveBookingEngine: false as const,
};

export function isStartingWorkPilotEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.MAPABLE_STARTING_WORK_PILOT_ENABLED === "true";
}

export function isStartingWorkDbPersistenceEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (
    env.MAPABLE_STARTING_WORK_PILOT_ENABLED === "true" &&
    env.MAPABLE_STARTING_WORK_DB_PERSISTENCE_ENABLED === "true"
  );
}

/**
 * Shared availability for `/pilot/starting-work/interview` and the gated
 * `/unified` entry. Requires Starting Work pilot + synthetic-only posture.
 * Allowed in local/CI/Vercel Preview; denied on Vercel production or when
 * deployment context is indeterminate / flags off.
 */
export function isInterviewJourneyPreviewAvailable(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  if (env.MAPABLE_STARTING_WORK_PILOT_ENABLED !== "true") return false;
  if (env.MAPABLE_STARTING_WORK_SYNTHETIC_ONLY === "false") return false;
  if (env.VERCEL_ENV === "production") return false;
  // Vercel preview / development, or non-Vercel local/CI (VERCEL unset).
  if (env.VERCEL === "1" && env.VERCEL_ENV && env.VERCEL_ENV !== "preview" && env.VERCEL_ENV !== "development") {
    return false;
  }
  return true;
}
