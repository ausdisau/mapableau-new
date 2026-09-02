/**
 * Proactive Mission Watch + Temporal Planner feature flags (Prompt 06).
 * Fail-closed: watch evaluation requires explicit enablement.
 * AI/proactive planning kill does not stop deterministic watch evaluation.
 */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const MISSION_WATCH_FLAG = "MAPABLE_MISSION_WATCH_ENABLED";
export const PROACTIVE_PLANNING_FLAG = "MAPABLE_PROACTIVE_PLANNING_ENABLED";
export const MISSION_WATCH_KILL_SWITCH_FLAG = "MAPABLE_MISSION_WATCH_KILL_SWITCH";
export const PROACTIVE_AI_KILL_SWITCH_FLAG = "MAPABLE_PROACTIVE_AI_KILL_SWITCH";

export const missionWatchConfig = {
  get enabled(): boolean {
    return envFlag(MISSION_WATCH_FLAG, false) && !this.killSwitchActive;
  },
  /** Soft AI assist for explanations — never required for deterministic evaluation. */
  get proactivePlanningEnabled(): boolean {
    return (
      this.enabled &&
      !this.aiKillSwitchActive &&
      envFlag(PROACTIVE_PLANNING_FLAG, false)
    );
  },
  get killSwitchActive(): boolean {
    return envFlag(MISSION_WATCH_KILL_SWITCH_FLAG, false);
  },
  /** Disables AI-assisted planning only; deterministic watch rules still run. */
  get aiKillSwitchActive(): boolean {
    return envFlag(PROACTIVE_AI_KILL_SWITCH_FLAG, false);
  },
  get mayEvaluateWatches(): boolean {
    return this.enabled && !this.killSwitchActive;
  },
};

export function isMissionWatchEnabled(): boolean {
  return missionWatchConfig.enabled;
}

export function isProactivePlanningEnabled(): boolean {
  return missionWatchConfig.proactivePlanningEnabled;
}
