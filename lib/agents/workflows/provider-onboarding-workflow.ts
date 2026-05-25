export async function runProviderOnboardingWorkflow(params: {
  organisationId: string;
}): Promise<{
  workflowId: string;
  steps: string[];
  status: "needs_human_review";
}> {
  return {
    workflowId: "provider_onboarding",
    steps: [
      "verification_checklist",
      "insurance_review",
      "booking_eligibility_gate",
      "quality_policy_acknowledgement",
    ],
    status: "needs_human_review",
  };
}
