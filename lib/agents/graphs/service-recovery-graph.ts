import type { GraphRunInput, GraphRunResult } from "./graph-types";

export async function runServiceRecoveryGraph(
  input: GraphRunInput
): Promise<GraphRunResult> {
  const noShow = /did not show|no show|missed|cancelled/i.test(input.message);

  const steps = [
    {
      stepId: "failure_classifier_agent",
      status: "drafted" as const,
      output: {
        failureType: noShow ? "no_show" : "service_disruption",
      },
      requiresHumanReview: false,
    },
    {
      stepId: "backup_options_agent",
      status: "drafted" as const,
      output: {
        options: [
          "Reschedule with same provider",
          "Search alternative verified provider",
          "Escalate to support desk",
        ],
      },
      requiresHumanReview: false,
    },
    {
      stepId: "eligibility_gate_agent",
      status: "drafted" as const,
      output: { eligible: true, note: "Eligibility checks are indicative only." },
      requiresHumanReview: false,
    },
    {
      stepId: "participant_choice_node",
      status: "requires_confirmation" as const,
      output: {
        message: "Choose how you would like to recover this service.",
      },
      requiresHumanReview: true,
    },
    {
      stepId: "provider_confirmation_node",
      status: "requires_confirmation" as const,
      output: {
        message: "Provider must confirm any replacement booking.",
      },
      requiresHumanReview: true,
    },
    {
      stepId: "recovery_case_update_node",
      status: "drafted" as const,
      output: {
        status: "draft_only",
        caseNote: input.message.slice(0, 300),
      },
      requiresHumanReview: false,
    },
  ];

  return {
    graphId: "service_recovery",
    steps,
    finalStatus: "requires_confirmation",
    summary:
      "Service recovery options drafted. High-risk worker assignment requires your confirmation.",
    requiresHumanConfirmation: true,
  };
}
