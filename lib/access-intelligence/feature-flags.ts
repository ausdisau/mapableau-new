/**
 * Feature flags for Access Intelligence expansion programme.
 * Risky external integrations default OFF.
 * Values are read via getters so runtime env (and tests) can toggle safely.
 */

function envTrue(name: string): boolean {
  const v = process.env[name];
  return v === "true" || v === "1";
}

function envFalse(name: string): boolean {
  const v = process.env[name];
  return v === "false" || v === "0";
}

export const accessIntelligenceFlags = {
  /** Demo fixtures / soft open entitlements when not explicitly false. */
  get demoMode() {
    return (
      !envFalse("ACCESS_INTELLIGENCE_DEMO_MODE") &&
      process.env.ACCESS_INTELLIGENCE_DEMO_MODE !== "0"
    );
  },

  /** Persist passports / visit plans / living twin via Prisma. */
  get usePrisma() {
    return envTrue("ACCESS_INTELLIGENCE_USE_PRISMA");
  },

  /** Prefer AccessPlace id for place resolution and visit-plan binding. */
  get canonicalPlaceBinding() {
    return !envFalse("ACCESS_INTELLIGENCE_CANONICAL_PLACE_BINDING");
  },

  /** Soft-open pilot console demo data. */
  get allowPilotDemo() {
    return envTrue("ACCESS_INTELLIGENCE_ALLOW_PILOT_DEMO");
  },

  /** Allow x-access-role demo preview header. */
  get allowDemoRolePreview() {
    return envTrue("ACCESS_INTELLIGENCE_ALLOW_DEMO_ROLE_PREVIEW");
  },

  /** Live BMS adapter — default off until URL configured. */
  get liveBms() {
    return Boolean(process.env.ACCESS_INTELLIGENCE_BMS_URL?.trim());
  },

  /** Messaging webhook delivery — default off. */
  get liveMessaging() {
    return Boolean(
      process.env.ACCESS_INTELLIGENCE_MESSAGING_WEBHOOK_URL?.trim(),
    );
  },

  /** Wave 1+ programme flags (default off until implemented). */
  get reliabilityConsole() {
    return envTrue("ACCESS_INTELLIGENCE_RELIABILITY_CONSOLE");
  },
  get reverificationScheduler() {
    return envTrue("ACCESS_INTELLIGENCE_REVERIFICATION_SCHEDULER");
  },
  get journeyPreflight() {
    return envTrue("ACCESS_INTELLIGENCE_JOURNEY_PREFLIGHT");
  },
  get journeyGuardian() {
    return envTrue("ACCESS_INTELLIGENCE_JOURNEY_GUARDIAN");
  },
  get offlineVisitPack() {
    return envTrue("ACCESS_INTELLIGENCE_OFFLINE_VISIT_PACK");
  },
  get guideGenerator() {
    return envTrue("ACCESS_INTELLIGENCE_GUIDE_GENERATOR");
  },
  get mapperFieldKit() {
    return envTrue("ACCESS_INTELLIGENCE_MAPPER_FIELD_KIT");
  },
  get contributorPathway() {
    return envTrue("ACCESS_INTELLIGENCE_CONTRIBUTOR_PATHWAY");
  },
  get temporaryEventPlanner() {
    return envTrue("ACCESS_INTELLIGENCE_TEMPORARY_EVENT_PLANNER");
  },
  get widget() {
    return envTrue("ACCESS_INTELLIGENCE_WIDGET");
  },
  get sdkApi() {
    return envTrue("ACCESS_INTELLIGENCE_SDK_API");
  },
  get regionalControlTower() {
    return envTrue("ACCESS_INTELLIGENCE_REGIONAL_CONTROL_TOWER");
  },
  get missionConsole() {
    return envTrue("ACCESS_INTELLIGENCE_MISSION_CONSOLE");
  },
  get employmentOrchestrator() {
    return envTrue("ACCESS_INTELLIGENCE_EMPLOYMENT_ORCHESTRATOR");
  },
  get regressionSimulator() {
    return envTrue("ACCESS_INTELLIGENCE_REGRESSION_SIMULATOR");
  },
};

export type AccessIntelligenceFlagKey = keyof typeof accessIntelligenceFlags;

/** Audit snapshot for ops / release evidence (no secrets). */
export function listAccessIntelligenceFlagStates(): Record<
  AccessIntelligenceFlagKey,
  boolean
> {
  const out = {} as Record<AccessIntelligenceFlagKey, boolean>;
  for (const key of Object.keys(
    accessIntelligenceFlags,
  ) as AccessIntelligenceFlagKey[]) {
    out[key] = Boolean(accessIntelligenceFlags[key]);
  }
  return out;
}
