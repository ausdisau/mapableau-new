/**
 * Personal Agency Infrastructure (My MapAble) — fail-closed feature flags.
 */

function envTrue(key: string): boolean {
  return process.env[key] === "true";
}

export const personalAgencyFlags = {
  get uiEnabled() {
    return envTrue("MAPABLE_PERSONAL_AGENCY_UI");
  },
  get homeEnabled() {
    return envTrue("MAPABLE_MY_MAPABLE_HOME");
  },
  get lifeIntentsEnabled() {
    return envTrue("MAPABLE_LIFE_INTENTS");
  },
  get agencyControlEnabled() {
    return envTrue("MAPABLE_AGENCY_CONTROL");
  },
  get firstRunSetupEnabled() {
    return envTrue("MAPABLE_PAI_FIRST_RUN");
  },
  /** Participant /my routes may render when true. */
  get routesEnabled() {
    return this.uiEnabled;
  },
  /** Unified sidebar shell for /my (desktop sidebar + mobile tabs). */
  get unifiedShellEnabled() {
    return envTrue("NEXT_PUBLIC_UNIFIED_SHELL");
  },
};

export function personalAgencyDisabledResponse(feature: string): Response {
  return Response.json(
    {
      enabled: false,
      feature,
      message: "My MapAble is not enabled in this environment.",
    },
    { status: 404 },
  );
}
