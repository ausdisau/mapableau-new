import type { GraphRunInput, GraphRunResult } from "./graph-types";

export async function runIncidentTriageGraph(
  input: GraphRunInput
): Promise<GraphRunResult> {
  const description = input.message;
  const critical = /injury|abuse|neglect|emergency|death|hospital/i.test(
    description
  );
  const severity = critical ? "critical" : /harm|unsafe|assault/i.test(description)
    ? "high"
    : "medium";

  const steps = [
    {
      stepId: "intake_agent",
      status: "drafted" as const,
      output: { intakeSummary: description.slice(0, 500) },
      requiresHumanReview: false,
    },
    {
      stepId: "risk_classifier_agent",
      status: "drafted" as const,
      output: { severity, critical },
      requiresHumanReview: false,
    },
    {
      stepId: "make_safe_agent",
      status: "drafted" as const,
      output: {
        immediateActions: critical
          ? ["Ensure immediate safety", "Contact emergency services if needed"]
          : ["Document what happened", "Preserve evidence"],
      },
      requiresHumanReview: false,
    },
    {
      stepId: "reportability_check_agent",
      status: "requires_human_review" as const,
      output: {
        reportability: "undetermined",
        note: "External reportability requires authorised human decision.",
      },
      requiresHumanReview: true,
    },
    {
      stepId: "human_review_node",
      status: "requires_human_review" as const,
      output: { required: true, reason: "All incidents require staff review." },
      requiresHumanReview: true,
    },
    {
      stepId: "draft_incident_record_node",
      status: "requires_confirmation" as const,
      output: {
        status: "draft_only",
        title: description.slice(0, 80),
        message: "Submit via Incidents after you confirm details.",
      },
      requiresHumanReview: true,
    },
    {
      stepId: "notification_plan_node",
      status: "drafted" as const,
      output: {
        notifications: ["Participant nominee if applicable", "Quality team"],
        externalSubmission: false,
      },
      requiresHumanReview: severity === "critical",
    },
  ];

  const finalStatus =
    severity === "critical" ? "requires_human_review" : "requires_confirmation";

  return {
    graphId: "incident_triage",
    steps,
    finalStatus,
    summary:
      "Incident triage draft prepared. Critical matters always need staff review before any external report.",
    requiresHumanConfirmation: true,
  };
}
