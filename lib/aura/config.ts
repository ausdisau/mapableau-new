/**
 * Central runtime configuration for AURA (Wave 10). Every switch defaults to
 * "off" so nothing can go live via `AURA_*` env alone: production activation
 * of a specific agent, model, or protocol still requires an explicit
 * activation flag on the corresponding manifest / registration row.
 */

function envFlag(key: string): boolean {
  const raw = process.env[key];
  if (raw === undefined) return false;
  return raw === "1" || raw.toLowerCase() === "true";
}

function envInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export const auraConfig = {
  enabled: envFlag("AURA_ENABLED"),
  simulationMandatory: !envFlag("AURA_ALLOW_UNSIMULATED_EXECUTION"),
  mcpEnabled: envFlag("AURA_MCP_ENABLED"),
  a2aExperimentalEnabled: envFlag("AURA_A2A_EXPERIMENTAL_ENABLED"),
  autoParticipantGoalsFromChat: false, // hardcoded off, never toggle
  autoMemoryFromModelOutput: false, // hardcoded off, never toggle
  productionIntegrationsActivated: envFlag(
    "AURA_PRODUCTION_INTEGRATIONS_ACTIVATED"
  ),
  killSwitchGlobal: envFlag("AURA_KILL_SWITCH"),
  planStepCap: envInt("AURA_PLAN_STEP_CAP", 32),
  planDepthCap: envInt("AURA_PLAN_DEPTH_CAP", 8),
  executionAttemptCap: envInt("AURA_EXECUTION_ATTEMPT_CAP", 3),
  defaultAuthorityMinutesTtl: envInt("AURA_DEFAULT_AUTHORITY_TTL_MINUTES", 240),
  defaultApprovalTtlMinutes: envInt("AURA_DEFAULT_APPROVAL_TTL_MINUTES", 60),
} as const;

export type AuraConfig = typeof auraConfig;
