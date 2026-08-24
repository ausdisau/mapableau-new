import { createHash } from "node:crypto";

import type { MapAbleMissionPlan } from "@/lib/ai/platform/missions/types";

import { getAtRiskNodeIds, getPreservedNodeIds } from "./impact";
import type { DependencyImpact, MapAbleRecoveryAlternative, MaterialityGate, RecoveryConfidence } from "./types";

function deterministicAlternativeId(label: string, planVersion: number): string {
  return createHash("sha256").update(`${label}:${planVersion}`).digest("hex").slice(0, 16);
}

export function generateRecoveryAlternatives(input: {
  plan: MapAbleMissionPlan; impacts: DependencyImpact[]; materialityGate: MaterialityGate;
  candidatePlanVersion: number; rejectedAlternativeIds?: string[];
}): MapAbleRecoveryAlternative[] {
  const alternatives: MapAbleRecoveryAlternative[] = [];
  const atRisk = getAtRiskNodeIds(input.impacts);
  const preserved = getPreservedNodeIds(input.impacts);
  const rejected = new Set(input.rejectedAlternativeIds ?? []);

  if (input.materialityGate === "BLOCKED") {
    return [buildAlternative({ label: "Contact human support",
      summary: "The current timeline appears impossible. A human coordinator can help explore options.",
      affectedNodeIds: atRisk, preservedNodeIds: preserved, materialityGate: input.materialityGate,
      confidence: "verified", requiresParticipantDecision: true, requiresReapproval: false, requiresHumanReview: true,
      candidatePlanVersion: input.candidatePlanVersion, actionProposalIds: [], limitations: ["No automatic reschedule attempted"] })];
  }
  if (input.materialityGate === "HUMAN_REVIEW_REQUIRED") {
    return [buildAlternative({ label: "Wait for human review",
      summary: "A safeguarding or sensitive signal was detected. Human review must continue this workflow.",
      affectedNodeIds: atRisk, preservedNodeIds: preserved, materialityGate: input.materialityGate,
      confidence: "verified", requiresParticipantDecision: false, requiresReapproval: false, requiresHumanReview: true,
      candidatePlanVersion: input.candidatePlanVersion, actionProposalIds: [], limitations: ["Automated recovery paused"] })];
  }

  const hasTransportFailure = input.impacts.some(i => i.nodeId === "node-transport" && (i.currentState === "failed" || i.currentState === "at_risk"));
  const hasWorkerFailure = input.impacts.some(i => i.nodeId === "node-care-support" && (i.currentState === "failed" || i.currentState === "at_risk"));
  const hasAccessChange = input.impacts.some(i => i.nodeId === "node-workplace-access" && i.currentState === "at_risk");

  if (hasTransportFailure) {
    push(alternatives, rejected, buildAlternative({ label: "Prepare alternative transport draft",
      summary: "MapAble can prepare a draft accessible transport request for your review. Nothing is booked automatically.",
      affectedNodeIds: ["node-transport"], preservedNodeIds: preserved.filter(id => id !== "node-transport"),
      materialityGate: input.materialityGate, confidence: "supported", requiresParticipantDecision: true,
      requiresReapproval: input.materialityGate === "REAPPROVAL_REQUIRED", requiresHumanReview: false,
      candidatePlanVersion: input.candidatePlanVersion,
      actionProposalIds: input.plan.actionProposals.filter(p => p.action === "prepare_transport_request").map(p => p.id),
      limitations: ["Live vehicle availability not verified"] }));
    push(alternatives, rejected, buildAlternative({ label: "Confirm I have my own transport",
      summary: "Tell MapAble you already have transport arranged. Your plan will note this without booking anything.",
      affectedNodeIds: ["node-transport"], preservedNodeIds: preserved, materialityGate: input.materialityGate,
      confidence: "partial", requiresParticipantDecision: true, requiresReapproval: false, requiresHumanReview: false,
      candidatePlanVersion: input.candidatePlanVersion, actionProposalIds: [],
      limitations: ["MapAble does not verify your transport arrangement"] }));
  }
  if (hasWorkerFailure) {
    push(alternatives, rejected, buildAlternative({ label: "Prepare support request draft",
      summary: "MapAble can prepare a draft support request. No worker is assigned automatically.",
      affectedNodeIds: ["node-care-support"], preservedNodeIds: preserved.filter(id => id !== "node-care-support"),
      materialityGate: input.materialityGate, confidence: "supported", requiresParticipantDecision: true,
      requiresReapproval: input.materialityGate === "REAPPROVAL_REQUIRED", requiresHumanReview: false,
      candidatePlanVersion: input.candidatePlanVersion,
      actionProposalIds: input.plan.actionProposals.filter(p => p.action === "prepare_care_request").map(p => p.id),
      limitations: ["Worker availability not verified"] }));
  }
  if (hasAccessChange) {
    push(alternatives, rejected, buildAlternative({ label: "Review workplace access evidence",
      summary: "Review updated workplace accessibility information before deciding next steps.",
      affectedNodeIds: ["node-workplace-access"], preservedNodeIds: preserved.filter(id => id !== "node-workplace-access"),
      materialityGate: input.materialityGate, confidence: "uncertain", requiresParticipantDecision: true,
      requiresReapproval: false, requiresHumanReview: false, candidatePlanVersion: input.candidatePlanVersion,
      actionProposalIds: input.plan.actionProposals.filter(p => p.action === "prepare_adjustment_request").map(p => p.id),
      limitations: ["Employer-provided details may be unverified"] }));
  }
  if (!alternatives.length && input.materialityGate !== "NON_MATERIAL") {
    alternatives.push(buildAlternative({ label: "Review updated plan",
      summary: "MapAble has refreshed evidence and dependencies. Review the updated plan and decide next steps.",
      affectedNodeIds: atRisk, preservedNodeIds: preserved, materialityGate: input.materialityGate, confidence: "partial",
      requiresParticipantDecision: input.materialityGate === "PARTICIPANT_DECISION_REQUIRED" || input.materialityGate === "REAPPROVAL_REQUIRED",
      requiresReapproval: input.materialityGate === "REAPPROVAL_REQUIRED", requiresHumanReview: false,
      candidatePlanVersion: input.candidatePlanVersion, actionProposalIds: [], limitations: [] }));
  }
  return alternatives;
}

function push(list: MapAbleRecoveryAlternative[], rejected: Set<string>, alt: MapAbleRecoveryAlternative) {
  if (!rejected.has(alt.alternativeId)) list.push(alt);
}

function buildAlternative(input: {
  label: string; summary: string; affectedNodeIds: string[]; preservedNodeIds: string[];
  materialityGate: MaterialityGate; confidence: RecoveryConfidence;
  requiresParticipantDecision: boolean; requiresReapproval: boolean; requiresHumanReview: boolean;
  candidatePlanVersion: number; actionProposalIds: string[]; limitations: string[];
}): MapAbleRecoveryAlternative {
  return {
    alternativeId: deterministicAlternativeId(input.label, input.candidatePlanVersion),
    label: input.label, summary: input.summary, affectedNodeIds: input.affectedNodeIds,
    preservedNodeIds: input.preservedNodeIds, materialityGate: input.materialityGate,
    confidence: input.confidence, requiresParticipantDecision: input.requiresParticipantDecision,
    requiresReapproval: input.requiresReapproval, requiresHumanReview: input.requiresHumanReview,
    candidatePlanVersion: input.candidatePlanVersion, actionProposalIds: input.actionProposalIds,
    kernelProposalIds: [], limitations: input.limitations,
  };
}

export function findAlternativeById(alternatives: MapAbleRecoveryAlternative[], alternativeId: string) {
  return alternatives.find(a => a.alternativeId === alternativeId) ?? null;
}
