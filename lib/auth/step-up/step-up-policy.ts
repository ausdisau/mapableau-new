export const STEP_UP_ACTIONS = {
  "ndis_document.view": { ttlMinutes: 15, label: "View NDIS documents" },
  "participant.export": { ttlMinutes: 10, label: "Export participant data" },
  "invoice.approve_high_value": { ttlMinutes: 15, label: "Approve high-value invoice" },
  "billing.payout_change": { ttlMinutes: 15, label: "Change payout or billing details" },
  "incident.view": { ttlMinutes: 15, label: "Access incident or safeguarding records" },
  "role.permission_change": { ttlMinutes: 10, label: "Change roles or permissions" },
  "integration.disconnect": { ttlMinutes: 10, label: "Disconnect an integration" },
  "emergency_profile.view": { ttlMinutes: 10, label: "View emergency profile" },
} as const;

export type StepUpActionKey = keyof typeof STEP_UP_ACTIONS;

export function isStepUpActionKey(key: string): key is StepUpActionKey {
  return key in STEP_UP_ACTIONS;
}

export function stepUpTtlMs(actionKey: StepUpActionKey): number {
  return STEP_UP_ACTIONS[actionKey].ttlMinutes * 60 * 1000;
}
