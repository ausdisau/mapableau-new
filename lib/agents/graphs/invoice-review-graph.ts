import type { GraphRunInput, GraphRunResult } from "./graph-types";

export async function runInvoiceReviewGraph(
  input: GraphRunInput
): Promise<GraphRunResult> {
  const invoiceIdMatch = input.message.match(/[a-z0-9]{20,}/i);
  const invoiceId = invoiceIdMatch?.[0] ?? "unknown";

  const steps = [
    {
      stepId: "invoice_summary_agent",
      status: "drafted" as const,
      output: {
        invoiceId,
        summary: "Invoice summary prepared (redacted).",
      },
      requiresHumanReview: false,
    },
    {
      stepId: "claim_validation_agent",
      status: "drafted" as const,
      output: {
        valid: true,
        warnings: ["Participant approval may still be required."],
        blockers: [],
      },
      requiresHumanReview: false,
    },
    {
      stepId: "plain_language_explainer_agent",
      status: "drafted" as const,
      output: {
        explanation:
          "This invoice relates to completed support. Payment processing needs participant or authorised nominee approval.",
      },
      requiresHumanReview: false,
    },
    {
      stepId: "participant_approval_prompt_node",
      status: "requires_confirmation" as const,
      output: {
        label: "Needs your confirmation",
        action: "Approve on the Invoices page — agents cannot approve payments.",
      },
      requiresHumanReview: true,
    },
    {
      stepId: "plan_manager_review_node",
      status: "drafted" as const,
      output: {
        applicable: input.context.role === "plan_manager",
        note: "Plan managers may review with billing.read consent.",
      },
      requiresHumanReview: false,
    },
  ];

  return {
    graphId: "invoice_review",
    steps,
    finalStatus: "requires_confirmation",
    summary:
      "Invoice review pack prepared. I cannot approve invoices or submit NDIS payments.",
    requiresHumanConfirmation: true,
  };
}
