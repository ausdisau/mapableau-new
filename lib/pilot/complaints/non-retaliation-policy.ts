export const NON_RETALIATION_POLICY = {
  version: "pilot-1",
  statement:
    "Participants and workers must not face adverse treatment for raising complaints during a ControlledPilot.",
  prohibitedActions: [
    "service_withdrawal_for_complaint",
    "enrolment_penalty",
    "worker_roster_punishment",
  ],
};

export function isRetaliatoryAction(action: string): boolean {
  return NON_RETALIATION_POLICY.prohibitedActions.includes(action);
}
