/**
 * Regional posture — HONESTY DOCUMENT.
 *
 * MapAble Wave 8 operates in a single Australian region (au-southeast). We do
 * NOT run active-active multi-region. Regional failover in this codebase is a
 * DOCUMENTED aspiration, not a live capability. Callers of the resilience
 * helpers MUST treat the region as fixed until a real DR runbook is
 * commissioned and evidenced.
 */

export const CURRENT_REGION = "au-southeast" as const;

export const ACTIVE_ACTIVE_ENABLED = false as const;

export function describeRegionalPosture() {
  return {
    currentRegion: CURRENT_REGION,
    activeActive: ACTIVE_ACTIVE_ENABLED,
    disclaimer:
      "Single-region only. No active-active multi-region capability is claimed.",
  };
}
