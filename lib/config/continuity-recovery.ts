export const continuityRecoveryConfig = {
  enabled: process.env.MAPABLE_CONTINUITY_RECOVERY_ENABLED === "true",
  /**
   * Permanent product rule: Care cancellation must never silently cancel Transport.
   * Even when orchestration v2 is on, auto-propagate cancel is refused.
   */
  allowCareTransportAutoCancel: false,
};

export function isContinuityRecoveryEnabled(): boolean {
  return continuityRecoveryConfig.enabled;
}

export function allowCareTransportAutoCancel(): boolean {
  return false;
}
