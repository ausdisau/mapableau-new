/**
 * Replay Lab feature flags.
 * Product flags default OFF. Permanent denies cannot be enabled by client params.
 */

function envTrue(name: string): boolean {
  const v = process.env[name];
  return v === "true" || v === "1";
}

export type ReplayLabMode = "synthetic";

function readMode(): ReplayLabMode {
  const raw = (process.env.MAPABLE_REPLAY_LAB_MODE ?? "synthetic").toLowerCase();
  if (raw === "synthetic") return "synthetic";
  return "synthetic";
}

/** Permanent denies — always false regardless of env (defence in depth). */
export const REPLAY_PERMANENT_DENY_FLAGS = {
  productionData: false,
  productionWrites: false,
  externalMessages: false,
  realPayments: false,
  realClaims: false,
  emergencyActions: false,
  aiReleaseApproval: false,
  universalScore: false,
} as const;

export const replayLabFlags = {
  get enabled() {
    return envTrue("MAPABLE_REPLAY_LAB_ENABLED");
  },
  get mode(): ReplayLabMode {
    return readMode();
  },
  get scenarioDsl() {
    return envTrue("MAPABLE_REPLAY_SCENARIO_DSL_ENABLED");
  },
  get virtualClock() {
    return envTrue("MAPABLE_REPLAY_VIRTUAL_CLOCK_ENABLED");
  },
  get chaosEngine() {
    return envTrue("MAPABLE_REPLAY_CHAOS_ENGINE_ENABLED");
  },
  get domainAdapters() {
    return envTrue("MAPABLE_REPLAY_DOMAIN_ADAPTERS_ENABLED");
  },
  get academy() {
    return envTrue("MAPABLE_REPLAY_ACADEMY_ENABLED");
  },
  get providerExercises() {
    return envTrue("MAPABLE_REPLAY_PROVIDER_EXERCISES_ENABLED");
  },
  get partnerConformance() {
    return envTrue("MAPABLE_REPLAY_PARTNER_CONFORMANCE_ENABLED");
  },
  get policySimulation() {
    return envTrue("MAPABLE_REPLAY_POLICY_SIMULATION_ENABLED");
  },
  get ci() {
    return envTrue("MAPABLE_REPLAY_CI_ENABLED");
  },
  get allowSyntheticExecution() {
    return this.enabled && this.mode === "synthetic";
  },
};

const DENY_CLIENT_KEYS = [
  "MAPABLE_REPLAY_PRODUCTION_DATA_ENABLED",
  "MAPABLE_REPLAY_PRODUCTION_WRITES_ENABLED",
  "MAPABLE_REPLAY_EXTERNAL_MESSAGES_ENABLED",
  "MAPABLE_REPLAY_REAL_PAYMENTS_ENABLED",
  "MAPABLE_REPLAY_REAL_CLAIMS_ENABLED",
  "MAPABLE_REPLAY_EMERGENCY_ACTIONS_ENABLED",
  "MAPABLE_REPLAY_AI_RELEASE_APPROVAL_ENABLED",
] as const;

export function assertClientCannotEnableDenyFlags(
  clientParams: Record<string, string | undefined>,
): string[] {
  const blocked: string[] = [];
  for (const key of DENY_CLIENT_KEYS) {
    const v = clientParams[key];
    if (v === "true" || v === "1") blocked.push(key);
  }
  return blocked;
}
