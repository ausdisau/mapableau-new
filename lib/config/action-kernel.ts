/**
 * Governed Action Kernel feature flags — fail-closed by default.
 */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const ACTION_KERNEL_MASTER_FLAG = "MAPABLE_ACTION_KERNEL_ENABLED";

export const actionKernelConfig = {
  /** Master switch for proposal / approval / execute APIs. */
  get enabled(): boolean {
    return envFlag(ACTION_KERNEL_MASTER_FLAG, false);
  },
  get savePreferenceEnabled(): boolean {
    return this.enabled && envFlag("MAPABLE_ACTION_SAVE_PREFERENCE_ENABLED", false);
  },
  get humanCoordinationEnabled(): boolean {
    return (
      this.enabled && envFlag("MAPABLE_ACTION_HUMAN_COORDINATION_ENABLED", false)
    );
  },
  get careRequestEnabled(): boolean {
    return this.enabled && envFlag("MAPABLE_ACTION_CARE_REQUEST_ENABLED", false);
  },
  get transportRequestEnabled(): boolean {
    return (
      this.enabled && envFlag("MAPABLE_ACTION_TRANSPORT_REQUEST_ENABLED", false)
    );
  },
  get providerMessageEnabled(): boolean {
    return this.enabled && envFlag("MAPABLE_ACTION_PROVIDER_MESSAGE_ENABLED", false);
  },
  /** Kill switch — immediately blocks all action kernel operations. */
  get killSwitchEngaged(): boolean {
    return envFlag("MAPABLE_ACTION_KERNEL_KILL_SWITCH", false);
  },
};

export function isActionKernelOperational(): boolean {
  return actionKernelConfig.enabled && !actionKernelConfig.killSwitchEngaged;
}

export function isActionTypeEnabled(
  actionKey: keyof typeof ACTION_TYPE_FLAGS,
): boolean {
  if (!isActionKernelOperational()) return false;
  return ACTION_TYPE_FLAGS[actionKey]();
}

const ACTION_TYPE_FLAGS = {
  save_participant_preference: () => actionKernelConfig.savePreferenceEnabled,
  request_human_coordination: () => actionKernelConfig.humanCoordinationEnabled,
  submit_care_request: () => actionKernelConfig.careRequestEnabled,
  submit_transport_request: () => actionKernelConfig.transportRequestEnabled,
  send_provider_message: () => actionKernelConfig.providerMessageEnabled,
} as const;

export type ActionKernelFlagKey = keyof typeof ACTION_TYPE_FLAGS;
