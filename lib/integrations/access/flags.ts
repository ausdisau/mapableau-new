/** Fail-closed flags for Open Infrastructure / Access as Infrastructure. */

function envTruthy(key: string): boolean {
  const v = process.env[key];
  return v === "1" || v === "true" || v === "yes";
}

export const openInfrastructureFlags = {
  get enabled() {
    return envTruthy("MAPABLE_OPEN_INFRASTRUCTURE_ENABLED");
  },
  get panoramax() {
    return this.enabled && envTruthy("MAPABLE_PANORAMAX_INTEGRATION_ENABLED");
  },
  get communityEvidence() {
    return (
      this.enabled && envTruthy("MAPABLE_ACCESS_COMMUNITY_EVIDENCE_V1_ENABLED")
    );
  },
  get projectSidewalk() {
    return this.enabled && envTruthy("MAPABLE_PROJECT_SIDEWALK_ENABLED");
  },
  get accessQuests() {
    return this.enabled && envTruthy("MAPABLE_ACCESS_QUESTS_ENABLED");
  },
  /** NOW — Overture-compatible base geography boundary (no planet import). */
  get overtureBaseGeography() {
    return this.enabled && envTruthy("MAPABLE_OVERTURE_BASE_GEOGRAPHY_ENABLED");
  },
  /** NOW — JSON-FG / public interop projection API. */
  get jsonFgApi() {
    return this.enabled && envTruthy("MAPABLE_ACCESS_JSON_FG_API_ENABLED");
  },
  /** NEXT seam — not a production civic bridge. */
  get open311() {
    return this.enabled && envTruthy("MAPABLE_OPEN311_ENABLED");
  },
  /** NEXT seam — Navigate remains authoritative for routing prefs. */
  get accessibleRouting() {
    return this.enabled && envTruthy("MAPABLE_ACCESSIBLE_ROUTING_ENABLED");
  },
  /** NEXT seam — Access Missions / ODK. */
  get accessMissions() {
    return this.enabled && envTruthy("MAPABLE_ACCESS_MISSIONS_ENABLED");
  },
  /** NEXT seam — SensorThings / FROST not deployed. */
  get sensorthings() {
    return this.enabled && envTruthy("MAPABLE_SENSORTHINGS_ENABLED");
  },
  get publicInteropApi() {
    return (
      this.enabled &&
      (envTruthy("MAPABLE_PUBLIC_ACCESS_INTEROP_API_ENABLED") ||
        envTruthy("MAPABLE_ACCESS_JSON_FG_API_ENABLED"))
    );
  },
  get communityAccessGraph() {
    return this.enabled && envTruthy("MAPABLE_COMMUNITY_ACCESS_GRAPH_ENABLED");
  },
  /** NEXT/LATER seam — agents remain L0–L3 stubs. */
  get agenticAccess() {
    return this.enabled && envTruthy("MAPABLE_AGENTIC_ACCESS_ENABLED");
  },
};

export function getOpenInfrastructureFlagMatrix(): Record<string, boolean> {
  return {
    enabled: openInfrastructureFlags.enabled,
    panoramax: openInfrastructureFlags.panoramax,
    communityEvidence: openInfrastructureFlags.communityEvidence,
    projectSidewalk: openInfrastructureFlags.projectSidewalk,
    accessQuests: openInfrastructureFlags.accessQuests,
    overtureBaseGeography: openInfrastructureFlags.overtureBaseGeography,
    jsonFgApi: openInfrastructureFlags.jsonFgApi,
    open311: openInfrastructureFlags.open311,
    accessibleRouting: openInfrastructureFlags.accessibleRouting,
    accessMissions: openInfrastructureFlags.accessMissions,
    sensorthings: openInfrastructureFlags.sensorthings,
    publicInteropApi: openInfrastructureFlags.publicInteropApi,
    communityAccessGraph: openInfrastructureFlags.communityAccessGraph,
    agenticAccess: openInfrastructureFlags.agenticAccess,
  };
}
