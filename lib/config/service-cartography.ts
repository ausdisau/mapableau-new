export const serviceCartographyConfig = {
  get enabled() {
    return process.env.MAPABLE_SERVICE_CARTOGRAPHY_PILOT === "true";
  },
  /** Synthetic fixtures only unless explicitly authorised. */
  get syntheticOnly() {
    return process.env.MAPABLE_SERVICE_CARTOGRAPHY_SYNTHETIC_ONLY !== "false";
  },
  authorityCeiling: "SYNTHETIC_PILOT_ONLY" as const,
  productionClaimStatus: "not_claimable" as const,
  maturity: "experimental_reference" as const,
  isLiveMatchingEngine: false as const,
  isBookingEngine: false as const,
  autoAssignment: false as const,
};

export function isServiceCartographyPilotEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.MAPABLE_SERVICE_CARTOGRAPHY_PILOT === "true";
}

export function isServiceCartographySyntheticOnly(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.MAPABLE_SERVICE_CARTOGRAPHY_SYNTHETIC_ONLY !== "false";
}

export function isServiceCartographySimulateEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (
    isServiceCartographyPilotEnabled(env) &&
    isServiceCartographySyntheticOnly(env)
  );
}
