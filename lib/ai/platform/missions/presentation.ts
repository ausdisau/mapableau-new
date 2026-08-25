import {
  formatReviewForParticipant,
  listHumanOpsQueue,
} from "@/lib/ai/platform/human-operations";
import { isHumanOperationsConsoleEnabled } from "@/lib/config/human-operations";

import type { MapAbleMissionPlan } from "./types";

export function formatMissionPlanForParticipant(plan: MapAbleMissionPlan): {
  heading: string;
  summary: string;
  readiness: string;
  servicesInvolved: string[];
  sections: Array<{ title: string; body: string; items?: string[] }>;
} {
  const services = plan.domains.filter((d) => d !== "core");
  const readiness =
    plan.status === "ready"
      ? "Ready for your review"
      : plan.status === "needs_information"
        ? "Needs more information"
        : plan.status === "needs_participant_decision"
          ? "Waiting for your decision"
          : plan.status === "human_review_required"
            ? "Human review required"
            : "Blocked — use non-AI path or contact support";

  const opsVisibility = isHumanOperationsConsoleEnabled()
    ? listHumanOpsQueue({ missionId: plan.missionId }).map((r) =>
        formatReviewForParticipant(r),
      )
    : [];

  const humanSupportItems = [
    ...plan.humanReviewItems.map((h) => h.continuationMessage),
    ...opsVisibility.map(
      (v) =>
        `${v.categoryLabel}: ${v.whyNeeded} — Status: ${v.status}. Handled by ${v.handlingTeam}. Next: ${v.whatHappensNext}`,
    ),
  ];

  return {
    heading: "Your MapAble mission plan",
    summary: plan.summary,
    readiness,
    servicesInvolved: services.length ? services : ["core"],
    sections: [
      {
        title: "What MapAble understands",
        body: plan.objective,
      },
      {
        title: "MapAble services involved",
        body: "These parts of MapAble may help — none act without your approval.",
        items: plan.activeAgents.map((a) => `${a.name} (${a.status})`),
      },
      {
        title: "Dependencies",
        body: "Steps that may depend on each other.",
        items: plan.missionGraph.edges.map((e) => `${e.fromId} → ${e.toId}: ${e.label}`),
      },
      {
        title: "Evidence used",
        body: "Material conclusions trace to these sources.",
        items: [
          ...plan.evidenceSummary.participantSupplied.map((e) => e.label),
          ...plan.evidenceSummary.systemSupplied.map((e) => e.label),
        ],
      },
      {
        title: "Still unknown",
        body: "MapAble has not verified these yet.",
        items: plan.uncertainties,
      },
      {
        title: "What could go wrong",
        body: "Continuity checks — not predictions of failure.",
        items: plan.continuityAlerts.map((a) => a.explanation),
      },
      {
        title: "Recommended next steps",
        body: "You decide whether to follow these.",
        items: plan.recommendations.map(
          (r) => `${r.what} — ${r.nextStep} (${r.whoDecides} decides)`,
        ),
      },
      {
        title: "Requires your approval",
        body: "Draft proposals only — never executed automatically.",
        items: plan.actionProposals.map((p) => `${p.action} (expires ${p.expiryIso})`),
      },
      {
        title: "Human support",
        body: humanSupportItems.length
          ? "A human reviewer may need to continue this workflow."
          : "No human review required right now.",
        items: humanSupportItems,
      },
      {
        title: "Non-AI route",
        body: plan.nonAiPath.description,
        items: [plan.nonAiPath.label],
      },
    ],
  };
}
