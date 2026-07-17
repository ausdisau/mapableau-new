export const WAVE17_FLAG_KEYS = [
  "WAVE17_PARTICIPATION_ENABLED",
  "WAVE17_DISCOVERY_ENABLED",
  "WAVE17_ORGANISER_PORTAL_ENABLED",
  "WAVE17_AURA_PARTICIPATION_ENABLED",
  "WAVE17_AUTO_PUBLISH_OPPORTUNITIES",
] as const;

export type Wave17FlagKey = (typeof WAVE17_FLAG_KEYS)[number];

function readBooleanFlag(key: Wave17FlagKey): boolean {
  return process.env[key] === "true";
}

export const participationFeatureFlags = {
  plannerEnabled() {
    return (
      readBooleanFlag("WAVE17_PARTICIPATION_ENABLED") ||
      process.env.PARTICIPATION_PLANNER_ENABLED === "true"
    );
  },
  discoveryEnabled() {
    return this.plannerEnabled() && readBooleanFlag("WAVE17_DISCOVERY_ENABLED");
  },
  organiserPortalEnabled() {
    return (
      this.plannerEnabled() &&
      readBooleanFlag("WAVE17_ORGANISER_PORTAL_ENABLED")
    );
  },
  auraParticipationEnabled() {
    return (
      this.plannerEnabled() &&
      readBooleanFlag("WAVE17_AURA_PARTICIPATION_ENABLED")
    );
  },
  autoPublishOpportunitiesEnabled() {
    return false;
  },
};

export function assertParticipationPlannerEnabled() {
  if (!participationFeatureFlags.plannerEnabled()) {
    throw new Error("WAVE17_PARTICIPATION_DISABLED");
  }
}
