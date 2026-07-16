/**
 * MapAble AURA feature flags (Wave 1–3).
 * Authority / safety flags are server-only — never NEXT_PUBLIC.
 */

function envTrue(name: string): boolean {
  const v = process.env[name];
  return v === "true" || v === "1";
}

function envFalse(name: string): boolean {
  const v = process.env[name];
  return v === "false" || v === "0";
}

export const auraFlags = {
  enabled: envTrue("MAPABLE_AURA_ENABLED"),
  modelReasoning: !envFalse("MAPABLE_AURA_MODEL_REASONING_ENABLED"),
  counterfactuals: !envFalse("MAPABLE_AURA_COUNTERFACTUALS_ENABLED"),
  resilience: !envFalse("MAPABLE_AURA_RESILIENCE_ENABLED"),
  planChallenge: !envFalse("MAPABLE_AURA_PLAN_CHALLENGE_ENABLED"),
  auditReplay: !envFalse("MAPABLE_AURA_AUDIT_REPLAY_ENABLED"),
  offlinePacks: !envFalse("MAPABLE_AURA_OFFLINE_PACKS_ENABLED"),
  /** Wave 3 — proposals / shadow (opt-in) */
  proposals: envTrue("MAPABLE_AURA_PROPOSALS_ENABLED"),
  proposalReview: envTrue("MAPABLE_AURA_PROPOSAL_REVIEW_ENABLED"),
  shadowEvaluation: envTrue("MAPABLE_AURA_SHADOW_EVALUATION_ENABLED"),
  /** Must remain false in Wave 3 */
  writeExecution: envTrue("MAPABLE_AURA_WRITE_EXECUTION_ENABLED"),
  externalDelivery: envTrue("MAPABLE_AURA_EXTERNAL_DELIVERY_ENABLED"),
  memory: envTrue("MAPABLE_AURA_MEMORY_ENABLED"),
  outcomeCalibration: !envFalse("MAPABLE_AURA_OUTCOME_CALIBRATION_ENABLED"),
  physicalActions: envTrue("MAPABLE_AURA_PHYSICAL_ACTIONS_ENABLED"),
  usePrisma: envTrue("MAPABLE_AURA_USE_PRISMA"),
  globalAiEnabled: !envFalse("MAPABLE_AI_ENABLED"),
  globalAiAudit: !envFalse("MAPABLE_AI_AUDIT_ENABLED"),
  globalAiWriteActions: envTrue("MAPABLE_AI_WRITE_ACTIONS"),
} as const;

export type AuraFlagKey = keyof typeof auraFlags;

export function listAuraFlagStates(): Record<AuraFlagKey, boolean> {
  const out = {} as Record<AuraFlagKey, boolean>;
  for (const key of Object.keys(auraFlags) as AuraFlagKey[]) {
    out[key] = Boolean(auraFlags[key]);
  }
  return out;
}

/**
 * Wave 3 ceiling is L3_PROPOSE when proposals are enabled (or in test/demo).
 * Execution levels remain unreachable.
 */
export function auraMaxAuthorityLevel(): "L2_RECOMMEND" | "L3_PROPOSE" {
  if (
    auraFlags.proposals ||
    process.env.NODE_ENV === "test" ||
    process.env.MAPABLE_AURA_DEMO === "true"
  ) {
    return "L3_PROPOSE";
  }
  return "L2_RECOMMEND";
}

/**
 * Stop AURA is mandatory whenever AURA is enabled.
 * Wave 3 also fails closed if execution flags are unexpectedly true while proposing.
 */
export function assertAuraCanStart(): void {
  if (
    !auraFlags.enabled &&
    process.env.MAPABLE_AURA_DEMO !== "true" &&
    process.env.NODE_ENV !== "test"
  ) {
    throw new Error("MAPABLE_AURA_DISABLED");
  }
  if (
    !auraFlags.globalAiEnabled &&
    process.env.MAPABLE_AURA_DEMO !== "true" &&
    process.env.NODE_ENV !== "test"
  ) {
    throw new Error("MAPABLE_AI_DISABLED");
  }
  if (typeof AbortController === "undefined") {
    throw new Error("AURA_STOP_UNAVAILABLE");
  }
}
