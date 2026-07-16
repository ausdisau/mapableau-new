/**
 * MapAble AURA feature flags.
 * Authority and safety flags are server-only — never NEXT_PUBLIC.
 * A client header must not enable AURA.
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
  /** Master switch — default off. */
  enabled: envTrue("MAPABLE_AURA_ENABLED"),

  /** Optional LLM reasoning; deterministic planner always available. */
  modelReasoning: !envFalse("MAPABLE_AURA_MODEL_REASONING_ENABLED"),

  counterfactuals: !envFalse("MAPABLE_AURA_COUNTERFACTUALS_ENABLED"),

  /** Wave 3 — non-executable proposals. */
  proposals: envTrue("MAPABLE_AURA_PROPOSALS_ENABLED"),

  /** Wave 4 — approved application writes. */
  writeExecution: envTrue("MAPABLE_AURA_WRITE_EXECUTION_ENABLED"),

  /** Wave 5 — durable Memory Cards. */
  memory: envTrue("MAPABLE_AURA_MEMORY_ENABLED"),

  outcomeCalibration: !envFalse("MAPABLE_AURA_OUTCOME_CALIBRATION_ENABLED"),

  /** Always false in production until safety review. */
  physicalActions: envTrue("MAPABLE_AURA_PHYSICAL_ACTIONS_ENABLED"),

  /** Persist via Prisma when true; Wave 1 defaults to in-memory. */
  usePrisma: envTrue("MAPABLE_AURA_USE_PRISMA"),

  /** Global AI kill switches (reuse). */
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

/** Wave 1 production authority must not exceed L2. */
export function auraMaxAuthorityLevel(): "L2_RECOMMEND" {
  return "L2_RECOMMEND";
}

export function assertAuraEnabled(): void {
  if (!auraFlags.enabled) {
    throw new Error("MAPABLE_AURA_DISABLED");
  }
  if (!auraFlags.globalAiEnabled) {
    throw new Error("MAPABLE_AI_DISABLED");
  }
}
