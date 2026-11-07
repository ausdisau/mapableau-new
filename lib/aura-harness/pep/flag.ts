/**
 * P01 PEP feature flag — fail closed. Only exact string "true" enables.
 */

function envTrue(key: string): boolean {
  return process.env[key] === "true";
}

export const pepFlags = {
  get enabled() {
    return envTrue("MAPABLE_PEP_ENABLED");
  },
};

export function isPepEnabled(): boolean {
  return pepFlags.enabled;
}
