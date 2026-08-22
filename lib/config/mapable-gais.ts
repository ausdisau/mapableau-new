/**
 * GAIS feature flags — all default OFF (fail-closed).
 */

function envTrue(key: string): boolean {
  return process.env[key] === "true";
}

export const mapableGaisFlags = {
  get enabled() {
    return envTrue("MAPABLE_GAIS_ENABLED");
  },
  get publicApiEnabled() {
    return envTrue("MAPABLE_GAIS_PUBLIC_API_ENABLED");
  },
  get compatibilityEnabled() {
    return envTrue("MAPABLE_GAIS_COMPATIBILITY_ENABLED");
  },
  get queryEnabled() {
    return envTrue("MAPABLE_GAIS_QUERY_ENABLED");
  },
  /** Public read endpoints may serve when true. */
  get readEnabled() {
    return this.enabled && this.publicApiEnabled;
  },
};

export function gaisFeatureDisabledResponse(feature: string): Response {
  return Response.json(
    {
      enabled: false,
      feature,
      message: "GAIS is not enabled in this environment.",
    },
    { status: 404 },
  );
}

export const GAIS_RESPONSE_META = {
  claimState: "in_development" as const,
  evidenceScope: "published_access_places_and_community_barriers" as const,
  liveNationalRouting: false as const,
};
