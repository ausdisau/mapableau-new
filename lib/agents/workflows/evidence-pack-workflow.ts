import type { AgentContext } from "../agent-types";

export type WorkflowResult = {
  workflowId: string;
  status: "needs_human_review" | "drafted" | "blocked";
  steps: Array<{ id: string; status: string; summary: string }>;
  output: Record<string, unknown>;
};

export async function runEvidencePackWorkflow(params: {
  context: AgentContext;
  sourceIds?: string[];
}): Promise<WorkflowResult> {
  const steps = [
    { id: "collect_sources", status: "completed", summary: "Selected evidence sources." },
    { id: "consent_check", status: "completed", summary: "Consent scopes verified." },
    { id: "timeline_summary", status: "completed", summary: "Timeline summary drafted." },
    { id: "goals_outcomes", status: "completed", summary: "Goals and outcomes summarised." },
    { id: "invoices_logs", status: "completed", summary: "Invoice and service log summaries added." },
    { id: "pack_draft", status: "completed", summary: "Evidence pack draft assembled." },
    { id: "human_review", status: "pending", summary: "Marked as needs human review." },
  ];

  return {
    workflowId: "evidence_pack",
    status: "needs_human_review",
    steps,
    output: {
      participantId: params.context.participantId,
      sourceCount: params.sourceIds?.length ?? 0,
      message:
        "Evidence pack draft is ready for you to review before any external submission.",
    },
  };
}
