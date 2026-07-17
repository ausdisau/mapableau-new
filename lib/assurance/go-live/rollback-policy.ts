export type RollbackPlan = {
  documented: boolean;
  steps: string[];
  killSwitchesNamed: string[];
};

export function buildDefaultRollbackPlan(): RollbackPlan {
  return {
    documented: true,
    steps: [
      "Engage integration kill switches for outbound NDIA/direct adapters.",
      "Pause ControlledPilot status to paused without deleting audit history.",
      "Freeze new billable item external submissions.",
      "Notify on-call and document incident timeline.",
    ],
    killSwitchesNamed: ["global_outbound", "ndia_direct"],
  };
}

export function rollbackPlanIsAdequate(plan: RollbackPlan | null | undefined): boolean {
  if (!plan) return false;
  return plan.documented && plan.steps.length >= 2 && plan.killSwitchesNamed.length >= 1;
}
