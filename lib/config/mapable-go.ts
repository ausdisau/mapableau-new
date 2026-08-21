/**
 * MapAble Go feature flags — all default OFF (fail-closed).
 */

function envTrue(key: string): boolean {
  return process.env[key] === "true";
}

export const mapableGoFlags = {
  get enabled() {
    return envTrue("MAPABLE_GO_ENABLED");
  },
  get navigateEnabled() {
    return envTrue("MAPABLE_NAVIGATE_ENABLED");
  },
  get routePlanningEnabled() {
    return envTrue("MAPABLE_GO_ROUTE_PLANNING_ENABLED");
  },
  get dynamicBarriersEnabled() {
    return envTrue("MAPABLE_GO_DYNAMIC_BARRIERS_ENABLED");
  },
  get publicTransportEnabled() {
    return envTrue("MAPABLE_GO_PUBLIC_TRANSPORT_ENABLED");
  },
  get assistiveInputEnabled() {
    return envTrue("MAPABLE_GO_ASSISTIVE_INPUT_ENABLED");
  },
  get mcpEnabled() {
    return envTrue("MAPABLE_GO_MCP_ENABLED");
  },
  get telemetryEnabled() {
    return envTrue("MAPABLE_GO_TELEMETRY_ENABLED");
  },
  /** True when participant Go routes may serve. */
  get participantRoutesEnabled() {
    return this.enabled && this.routePlanningEnabled;
  },
  /** True when Navigate engine API may serve. */
  get navigateApiEnabled() {
    return this.navigateEnabled && this.routePlanningEnabled;
  },
};

export function goFeatureDisabledResponse(feature: string): Response {
  return Response.json(
    {
      enabled: false,
      feature,
      message: "MapAble Go is not enabled in this environment.",
    },
    { status: 404 },
  );
}
