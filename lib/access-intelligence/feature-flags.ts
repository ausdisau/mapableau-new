/**
 * Feature flags for Access Intelligence expansion programme.
 * Risky external integrations default OFF.
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
  demoMode:
    !envFalse("ACCESS_INTELLIGENCE_DEMO_MODE") &&
    process.env.ACCESS_INTELLIGENCE_DEMO_MODE !== "0",

  /** Persist passports / visit plans / living twin via Prisma. */
  usePrisma: envTrue("ACCESS_INTELLIGENCE_USE_PRISMA"),

  /** Prefer AccessPlace id for place resolution and visit-plan binding. */
  canonicalPlaceBinding:
    !envFalse("ACCESS_INTELLIGENCE_CANONICAL_PLACE_BINDING"),

  /** Soft-open pilot console demo data. */
  allowPilotDemo: envTrue("ACCESS_INTELLIGENCE_ALLOW_PILOT_DEMO"),

  /** Allow x-access-role demo preview header. */
  allowDemoRolePreview: envTrue("ACCESS_INTELLIGENCE_ALLOW_DEMO_ROLE_PREVIEW"),

  /** Live BMS adapter — default off until URL configured. */
  liveBms: Boolean(process.env.ACCESS_INTELLIGENCE_BMS_URL?.trim()),

  /** Messaging webhook delivery — default off. */
  liveMessaging: Boolean(
    process.env.ACCESS_INTELLIGENCE_MESSAGING_WEBHOOK_URL?.trim(),
  ),

  /** Wave 1+ programme flags (default off until implemented). */
  reliabilityConsole: envTrue("ACCESS_INTELLIGENCE_RELIABILITY_CONSOLE"),
  reverificationScheduler: envTrue(
    "ACCESS_INTELLIGENCE_REVERIFICATION_SCHEDULER",
  ),
  journeyPreflight: envTrue("ACCESS_INTELLIGENCE_JOURNEY_PREFLIGHT"),
  journeyGuardian: envTrue("ACCESS_INTELLIGENCE_JOURNEY_GUARDIAN"),
  offlineVisitPack: envTrue("ACCESS_INTELLIGENCE_OFFLINE_VISIT_PACK"),
  guideGenerator: envTrue("ACCESS_INTELLIGENCE_GUIDE_GENERATOR"),
  mapperFieldKit: envTrue("ACCESS_INTELLIGENCE_MAPPER_FIELD_KIT"),
  contributorPathway: envTrue("ACCESS_INTELLIGENCE_CONTRIBUTOR_PATHWAY"),
  temporaryEventPlanner: envTrue("ACCESS_INTELLIGENCE_TEMPORARY_EVENT_PLANNER"),
  widget: envTrue("ACCESS_INTELLIGENCE_WIDGET"),
  sdkApi: envTrue("ACCESS_INTELLIGENCE_SDK_API"),
  regionalControlTower: envTrue("ACCESS_INTELLIGENCE_REGIONAL_CONTROL_TOWER"),
  missionConsole: envTrue("ACCESS_INTELLIGENCE_MISSION_CONSOLE"),
  employmentOrchestrator: envTrue(
    "ACCESS_INTELLIGENCE_EMPLOYMENT_ORCHESTRATOR",
  ),
  regressionSimulator: envTrue("ACCESS_INTELLIGENCE_REGRESSION_SIMULATOR"),
} as const;

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
