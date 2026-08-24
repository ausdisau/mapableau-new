/**
 * Adaptive Planning & Recovery Engine feature flags.
 * Fail-closed: recovery surfaces require explicit enablement.
 */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const ADAPTIVE_RECOVERY_FLAG = "MAPABLE_ADAPTIVE_RECOVERY_ENABLED";
export const PROACTIVE_REASSESSMENT_FLAG = "MAPABLE_PROACTIVE_REASSESSMENT_ENABLED";
export const RECOVERY_MODEL_ASSIST_FLAG = "MAPABLE_RECOVERY_MODEL_ASSIST_ENABLED";
export const RECOVERY_KILL_SWITCH_FLAG = "MAPABLE_RECOVERY_KILL_SWITCH";

export const adaptiveRecoveryConfig = {
  get enabled(): boolean {
    return envFlag(ADAPTIVE_RECOVERY_FLAG, false);
  },
  get proactiveReassessmentEnabled(): boolean {
    return (
      this.enabled &&
      !this.killSwitchActive &&
      envFlag(PROACTIVE_REASSESSMENT_FLAG, false)
    );
  },
  get modelAssistEnabled(): boolean {
    return this.enabled && envFlag(RECOVERY_MODEL_ASSIST_FLAG, false);
  },
  get killSwitchActive(): boolean {
    return envFlag(RECOVERY_KILL_SWITCH_FLAG, false);
  },
  get mayAutoReassess(): boolean {
    return this.proactiveReassessmentEnabled && !this.killSwitchActive;
  },
};

export function isAdaptiveRecoveryEnabled(): boolean {
  return adaptiveRecoveryConfig.enabled;
}
