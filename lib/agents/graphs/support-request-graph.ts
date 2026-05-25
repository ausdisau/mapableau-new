import type { AgentActionStatus } from "../agent-types";
import type { GraphRunInput, GraphRunResult, GraphStepResult } from "./graph-types";

export async function runSupportRequestGraph(
  input: GraphRunInput
): Promise<GraphRunResult> {
  const safeguarding = /safeguard|abuse|neglect/i.test(input.message);
  const draftStatus: AgentActionStatus = safeguarding
    ? "requires_human_review"
    : "requires_confirmation";
  const handoffStatus: AgentActionStatus = safeguarding
    ? "requires_human_review"
    : "drafted";

  const steps: GraphStepResult[] = [
    {
      stepId: "classify_request",
      status: "drafted" as const,
      output: {
        category: safeguarding ? "safeguarding" : "general_support",
        routeTo: safeguarding ? "quality_safeguards" : "support_desk",
      },
      requiresHumanReview: safeguarding,
    },
    {
      stepId: "draft_support_response",
      status: draftStatus,
      output: {
        status: "draft_only",
        draft: input.message.slice(0, 500),
      },
      requiresHumanReview: safeguarding,
    },
    {
      stepId: "human_handoff",
      status: handoffStatus,
      output: {
        handoff: safeguarding ? "quality_team" : "support_desk",
      },
      requiresHumanReview: safeguarding,
    },
  ];

  return {
    graphId: "support_request",
    steps,
    finalStatus: safeguarding ? "requires_human_review" : "requires_confirmation",
    summary: safeguarding
      ? "Safeguarding topic detected — staff review required before submission."
      : "Support request draft ready for your confirmation.",
    requiresHumanConfirmation: true,
  };
}
