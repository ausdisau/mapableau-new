import type { MapAbleRecoveryAlternative, MapAbleRecoveryState, RecoveryActivityEntry, WhatChangedItem } from "./types";

export function formatRecoveryForParticipant(input: {
  state: MapAbleRecoveryState; activity: RecoveryActivityEntry[];
}): { heading: string; status: string; sections: Array<{ title: string; body: string; items?: string[] }> } {
  return {
    heading: "Mission recovery", status: recoveryStatusLabel(input.state.status),
    sections: [
      { title: "What changed", body: input.state.whatChanged.length ? "These changes may affect your plan." : "No material changes detected since your last plan version.", items: input.state.whatChanged.map(w => w.summary) },
      { title: "Your current plan", body: `Active plan version ${input.state.activePlanVersion}. MapAble may prepare alternatives but will not decide for you.`, items: input.state.candidatePlanVersion ? [`Candidate version ${input.state.candidatePlanVersion} awaiting your review`] : undefined },
      { title: "Parts at risk", body: "Dependencies that may need attention.", items: input.state.impacts.filter(i => ["at_risk","failed","blocked","human_review"].includes(i.currentState)).map(i => `${i.label}: ${i.reason}`) },
      { title: "Options", body: "You choose whether to follow any option. Nothing executes automatically.", items: input.state.alternatives.map(a => `${a.label} (${confidenceLabel(a.confidence)})`) },
      { title: "What needs your decision", body: "MapAble cannot proceed without your explicit choice.", items: collectDecisionItems(input.state) },
      { title: "Previous plan", body: "Earlier plan versions remain available for reference.", items: input.state.previousPlanVersions.map(v => `Version ${v}`) },
      { title: "Activity", body: "Recent recovery activity on this mission.", items: input.activity.slice(-10).map(a => `${a.summary} (${a.kind})`) },
    ],
  };
}

function recoveryStatusLabel(status: MapAbleRecoveryState["status"]): string {
  switch (status) {
    case "stable": return "Your plan is stable";
    case "reassessing": return "MapAble is reviewing changes";
    case "awaiting_participant": return "Waiting for your decision";
    case "awaiting_reapproval": return "Reapproval needed before continuing";
    case "human_review": return "Human review required";
    case "blocked": return "Plan blocked — contact support";
    default: { const _e: never = status; return _e; }
  }
}
function confidenceLabel(c: MapAbleRecoveryAlternative["confidence"]): string {
  switch (c) {
    case "verified": return "verified"; case "supported": return "supported by evidence";
    case "partial": return "partially supported"; case "uncertain": return "uncertain"; case "unknown": return "unknown";
    default: { const _e: never = c; return _e; }
  }
}
function collectDecisionItems(state: MapAbleRecoveryState): string[] {
  const items: string[] = [];
  if (state.materialityGate === "PARTICIPANT_DECISION_REQUIRED") items.push("Choose how to respond to the changes");
  if (state.materialityGate === "REAPPROVAL_REQUIRED") items.push("Review and reapprove affected proposals");
  if (state.materialityGate === "HUMAN_REVIEW_REQUIRED") items.push("Wait for human reviewer — you may contact support");
  for (const alt of state.alternatives.filter(a => a.requiresParticipantDecision)) items.push(alt.label);
  return items.length ? items : ["No decisions required right now"];
}

export function buildWhatChangedItems(input: {
  fromVersion: number; toVersion: number;
  summaries: Array<{ category: WhatChangedItem["category"]; summary: string; detail: string; affectedNodeIds: string[] }>;
}): WhatChangedItem[] {
  return input.summaries.map((s, idx) => ({
    id: `what-changed-${input.toVersion}-${idx}`, category: s.category, summary: s.summary,
    detail: s.detail, affectedNodeIds: s.affectedNodeIds, sinceVersion: input.fromVersion,
  }));
}
