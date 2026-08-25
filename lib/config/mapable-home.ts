/**
 * MapAble Home (environmental capability framework) — fail-closed flags.
 *
 * Distinct from NDIS programme flag MAPABLE_HOME_ENABLED
 * (see lib/config/programme-flags.ts).
 *
 * Claim state: PROPOSED / IN DEVELOPMENT — not production-ready.
 * REAL_DEVICE_ACTIONS must remain false in this foundation.
 */

function envTrue(key: string): boolean {
  return process.env[key] === "true";
}

export const mapableHomeFlags = {
  /** Master switch for MapAble Home domain surfaces. */
  get enabled() {
    return envTrue("MAPABLE_HOME_ENV_ENABLED");
  },
  /** Public Labs Home experiment. */
  get labsEnabled() {
    return envTrue("MAPABLE_HOME_ENV_LABS_ENABLED");
  },
  /** In-memory simulator adapter (only executable path in P0). */
  get simulatorEnabled() {
    return envTrue("MAPABLE_HOME_ENV_SIMULATOR_ENABLED");
  },
  /** Google Home adapter scaffolding (no real account / SDK). */
  get googleEnabled() {
    return envTrue("MAPABLE_HOME_ENV_GOOGLE_ENABLED");
  },
  /** Alexa intent adapter scaffolding (no real account / skill). */
  get alexaEnabled() {
    return envTrue("MAPABLE_HOME_ENV_ALEXA_ENABLED");
  },
  /** Matter adapter scaffolding (no real fabric / CHIP controller). */
  get matterEnabled() {
    return envTrue("MAPABLE_HOME_ENV_MATTER_ENABLED");
  },
  /**
   * Physical device actuation. Hard-disabled for P0.
   * Broker rejects execute when this is false or when any non-simulator
   * adapter is targeted.
   */
  get realDeviceActionsEnabled() {
    return envTrue("MAPABLE_HOME_ENV_REAL_DEVICE_ACTIONS_ENABLED");
  },
};

export function mapableHomeDisabledResponse(feature: string): Response {
  return Response.json(
    {
      enabled: false,
      feature,
      message: "MapAble Home is not enabled in this environment.",
      claimState: "PROPOSED_IN_DEVELOPMENT",
    },
    { status: 404 },
  );
}
