import type { GraphRunInput, GraphRunResult } from "./graph-types";

export async function runTelehealthIntakeGraph(
  input: GraphRunInput
): Promise<GraphRunResult> {
  const steps = [
    {
      stepId: "collect_intake",
      status: "drafted" as const,
      output: { concerns: input.message.slice(0, 1000) },
      requiresHumanReview: false,
    },
    {
      stepId: "accessibility_check",
      status: "drafted" as const,
      output: { note: "Accessibility needs included for practitioner context." },
      requiresHumanReview: false,
    },
    {
      stepId: "practitioner_review_pack",
      status: "requires_human_review" as const,
      output: {
        status: "needs_practitioner_review",
        sections: ["presenting concerns", "accessibility", "consent"],
      },
      requiresHumanReview: true,
    },
    {
      stepId: "clinical_boundary_gate",
      status: "blocked" as const,
      output: {
        message: "No clinical diagnosis or treatment recommendations are produced.",
      },
      requiresHumanReview: true,
    },
  ];

  return {
    graphId: "telehealth_intake",
    steps,
    finalStatus: "requires_human_review",
    summary:
      "Telehealth intake draft prepared for practitioner review. Clinical decisions remain with your practitioner.",
    requiresHumanConfirmation: true,
  };
}
