/**
 * Human Operations + Escalation Console feature flags (Prompt 08).
 * Fail-closed: console and operator APIs require explicit enablement.
 */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const HUMAN_OPERATIONS_CONSOLE_FLAG =
  "MAPABLE_HUMAN_OPERATIONS_CONSOLE_ENABLED";

export const humanOperationsConfig = {
  get enabled(): boolean {
    return envFlag(HUMAN_OPERATIONS_CONSOLE_FLAG, false);
  },
};

export function isHumanOperationsConsoleEnabled(): boolean {
  return humanOperationsConfig.enabled;
}
