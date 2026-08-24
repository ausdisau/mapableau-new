import type { ProposalApprovalBinding } from "@/lib/ai/platform/human-review/contracts";
import type { ApprovalImpact, ApprovalPreservation, DependencyImpact, MapAbleMissionEvent, MaterialityGate, ReassessmentTrigger } from "./types";

export function evaluateMaterialityGate(input: {
  trigger: ReassessmentTrigger; impacts: DependencyImpact[]; events: MapAbleMissionEvent[];
}): MaterialityGate {
  if (!input.trigger.shouldReassess) return "NON_MATERIAL";
  if (input.trigger.reasonCodes.includes("SAFEGUARDING_ESCALATION")) return "HUMAN_REVIEW_REQUIRED";
  if (input.events.some(e => e.type === "CONSENT_REVOKED")) return "PARTICIPANT_DECISION_REQUIRED";
  if (input.events.some(e => e.type === "PRICE_CHANGED")) return "REAPPROVAL_REQUIRED";
  if (input.events.some(e => e.type === "PARTICIPANT_CHANGED_GOAL")) return "PARTICIPANT_DECISION_REQUIRED";
  if (input.events.some(e => e.type === "DEADLINE_APPROACHING")) {
    if (input.events.some(e => e.payload.impossible === true)) return "BLOCKED";
    return "PARTICIPANT_DECISION_REQUIRED";
  }
  if (input.impacts.some(i => i.currentState === "failed" || i.currentState === "at_risk")) return "PLAN_RECOMPUTE_ALLOWED";
  return "INFORMATIONAL_CHANGE";
}

export function evaluateApprovalPreservation(input: {
  bindings: ProposalApprovalBinding[]; events: MapAbleMissionEvent[]; materialityGate: MaterialityGate;
}): ApprovalImpact[] {
  return input.bindings.map(binding => {
    let preservation: ApprovalPreservation = "UNCHANGED_VALID";
    let explanation = "Approval remains valid for current plan version.";
    const now = Date.now();
    if (binding.expiresAt && new Date(binding.expiresAt).getTime() < now) { preservation = "EXPIRED"; explanation = "Approval has expired."; }
    else if (input.events.some(e => e.type === "PARTICIPANT_CHANGED_GOAL")) { preservation = "INVALIDATED_BY_GOAL_CHANGE"; explanation = "Goal changed — prior approval no longer applies."; }
    else if (input.events.some(e => e.type === "CONSENT_REVOKED")) { preservation = "INVALIDATED_BY_CONSENT_REVOKE"; explanation = "Consent withdrawn — approval invalidated."; }
    else if (input.events.some(e => e.type === "PRICE_CHANGED")) { preservation = "INVALIDATED_BY_PRICE_CHANGE"; explanation = "Price changed — reapproval required."; }
    else if (input.events.some(e => ["TRANSPORT_UNAVAILABLE","WORKER_CANCELLED","ACTION_FAILED"].includes(e.type))) { preservation = "INVALIDATED_BY_DEPENDENCY_FAILURE"; explanation = "Dependency failure invalidates prior approval."; }
    else if (input.events.some(e => e.type === "SAFEGUARDING_SIGNAL")) { preservation = "INVALIDATED_BY_SAFEGUARDING"; explanation = "Safeguarding signal — approval suspended."; }
    else if (input.materialityGate === "REAPPROVAL_REQUIRED") { preservation = "SUPERSEDED"; explanation = "Plan recompute requires fresh approval."; }
    return { proposalHash: binding.proposalHash, proposedAction: binding.proposedAction, preservation, explanation };
  });
}

export function requiresParticipantDecision(gate: MaterialityGate): boolean {
  return ["PARTICIPANT_DECISION_REQUIRED","REAPPROVAL_REQUIRED"].includes(gate);
}
export function requiresHumanReview(gate: MaterialityGate): boolean { return gate === "HUMAN_REVIEW_REQUIRED"; }
export function allowsPlanRecompute(gate: MaterialityGate): boolean {
  return ["PLAN_RECOMPUTE_ALLOWED","INFORMATIONAL_CHANGE","PARTICIPANT_DECISION_REQUIRED","REAPPROVAL_REQUIRED"].includes(gate);
}
