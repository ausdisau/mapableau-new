import { createHash, randomUUID } from "node:crypto";

import type { MapAbleModule } from "@/intelligence/types";
import type { MapAbleAgentActivationEntry } from "@/lib/ai/platform/agents/types";
import type { MapAbleHumanReviewItem } from "@/lib/ai/platform/agents/types";

import type {
  ContinuityAlert,
  EvidenceBundle,
  MapAbleMissionPlan,
  MapAbleMissionRequest,
  MapAbleMissionRuntimeContext,
  MissionActionProposal,
  MissionGraph,
  MissionPlanStatus,
  MissionRecommendation,
} from "./types";

function hashPayload(payload: Record<string, unknown>): string {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

function proposalExpiry(hours = 24): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function buildRecommendations(input: {
  graph: MissionGraph;
  domains: MapAbleModule[];
  plainLanguage: boolean;
}): MissionRecommendation[] {
  const recs: MissionRecommendation[] = [];
  const hasTransport = input.graph.nodes.some((n) => n.id === "node-transport");
  const hasCare = input.graph.nodes.some((n) => n.id === "node-care-support");
  const hasWorkplaceAccess = input.graph.nodes.some(
    (n) => n.id === "node-workplace-access",
  );

  if (hasWorkplaceAccess) {
    recs.push({
      id: "rec-workplace-access",
      what: "Review workplace accessibility evidence",
      why: "The interview appears onsite and verified workplace access features are not on file.",
      evidence: ["node-workplace-access"],
      uncertainty: ["Employer-provided access details may not be verified"],
      whoDecides: "participant",
      nextStep: "Confirm ramp, lift, toilet, and entry details with the employer if you choose.",
      domain: "access",
    });
  }

  if (hasTransport) {
    recs.push({
      id: "rec-transport",
      what: input.plainLanguage
        ? "Prepare an accessible transport request"
        : "Draft accessible transport preparation",
      why: "No confirmed accessible journey exists for the identified event.",
      evidence: ["node-transport"],
      uncertainty: ["Live vehicle availability has not been checked"],
      whoDecides: "participant",
      nextStep: "Review transport options and approve any draft request.",
      domain: "transport",
    });
  }

  if (hasCare) {
    recs.push({
      id: "rec-care-support",
      what: "Prepare a support request for interview preparation",
      why: "Support coverage for getting ready or attending is not confirmed.",
      evidence: ["node-care-support"],
      uncertainty: ["Worker availability not verified"],
      whoDecides: "participant",
      nextStep: "Review support options; nothing is assigned automatically.",
      domain: "care",
    });
  }

  if (input.domains.includes("jobs")) {
    recs.push({
      id: "rec-arrival-buffer",
      what: "Check arrival buffer and timing",
      why: "Cross-domain dependencies may affect whether you arrive on time.",
      evidence: ["node-goal"],
      uncertainty: ["Calendar timing not confirmed"],
      whoDecides: "participant",
      nextStep: "Confirm interview time and allow buffer for access and transport.",
      domain: "core",
    });
  }

  return recs;
}

function buildActionProposals(
  recommendations: MissionRecommendation[],
  objective: string,
): MissionActionProposal[] {
  const proposals: MissionActionProposal[] = [];

  for (const rec of recommendations) {
    if (rec.id === "rec-transport") {
      const payload = {
        kind: "prepare_transport_request",
        objective: objective.slice(0, 500),
        mobilityRequirement: "requires_wheelchair_accessible_vehicle",
      };
      proposals.push({
        id: randomUUID(),
        action: "prepare_transport_request",
        payload,
        informationToShare: ["Journey purpose", "Mobility requirement (functional)"],
        purpose: "Draft only — participant reviews before any booking",
        estimatedCost: null,
        unknownCosts: true,
        cancellationTerms: null,
        requiredConsent: ["profile.read"],
        requiredApprovals: ["participant"],
        payloadHash: hashPayload(payload),
        expiryIso: proposalExpiry(),
        status: "proposed",
      });
    }
    if (rec.id === "rec-care-support") {
      const payload = {
        kind: "prepare_care_request",
        objective: objective.slice(0, 500),
        supportPurpose: "interview_preparation",
      };
      proposals.push({
        id: randomUUID(),
        action: "prepare_care_request",
        payload,
        informationToShare: ["Support purpose", "Timing preferences"],
        purpose: "Draft only — no worker assignment",
        estimatedCost: null,
        unknownCosts: true,
        cancellationTerms: null,
        requiredConsent: ["profile.read"],
        requiredApprovals: ["participant"],
        payloadHash: hashPayload(payload),
        expiryIso: proposalExpiry(),
        status: "proposed",
      });
    }
  }

  return proposals;
}

function derivePlanStatus(input: {
  humanReviewItems: MapAbleHumanReviewItem[];
  continuityAlerts: ContinuityAlert[];
  evidence: EvidenceBundle;
  graph: MissionGraph;
}): MissionPlanStatus {
  if (input.humanReviewItems.length > 0) {
    return "human_review_required";
  }
  if (input.graph.nodes.some((n) => n.status === "not_authorised")) {
    return "blocked";
  }
  if (
    input.evidence.missing.length > 0 ||
    input.graph.nodes.some((n) => n.status === "missing" || n.status === "needs_review")
  ) {
    return "needs_information";
  }
  if (input.continuityAlerts.some((a) => a.severity === "attention")) {
    return "needs_participant_decision";
  }
  return "ready";
}

export function compileMissionPlan(input: {
  request: MapAbleMissionRequest;
  context: MapAbleMissionRuntimeContext;
  graph: MissionGraph;
  evidence: EvidenceBundle;
  continuityAlerts: ContinuityAlert[];
  humanReviewItems: MapAbleHumanReviewItem[];
  activeAgents: MapAbleAgentActivationEntry[];
  rejectedRecommendationIds?: string[];
}): MapAbleMissionPlan {
  const now = new Date().toISOString();
  const recommendations = buildRecommendations({
    graph: input.graph,
    domains: input.context.domains,
    plainLanguage: input.request.plainLanguage,
  }).filter((r) => !input.rejectedRecommendationIds?.includes(r.id));

  const actionProposals = buildActionProposals(
    recommendations,
    input.request.objective,
  );

  const uncertainties = [
    ...input.evidence.missing.map((m) => `Missing: ${m}`),
    ...input.graph.nodes
      .filter((n) => n.status === "needs_review" || n.status === "missing")
      .map((n) => `${n.label}: ${n.status}`),
  ];

  const status = derivePlanStatus({
    humanReviewItems: input.humanReviewItems,
    continuityAlerts: input.continuityAlerts,
    evidence: input.evidence,
    graph: input.graph,
  });

  const summary =
    input.request.plainLanguage
      ? `MapAble understands your goal and mapped ${input.context.domains.filter((d) => d !== "core").join(", ") || "core"} services. Nothing will be booked or sent without your approval.`
      : `Mission plan compiled for domains: ${input.context.domains.join(", ")}. Authority ceiling: ${input.context.authorityCeiling}.`;

  return {
    missionId: input.request.missionId,
    objective: input.request.objective,
    status,
    summary,
    activeAgents: input.activeAgents,
    domains: input.context.domains,
    missionGraph: input.graph,
    evidenceSummary: input.evidence,
    uncertainties,
    continuityAlerts: input.continuityAlerts,
    recommendations,
    actionProposals,
    humanReviewItems: input.humanReviewItems,
    approvalRequirements: actionProposals.flatMap((p) => p.requiredApprovals),
    nonAiPath: {
      label: "Continue without AI planning",
      href: input.request.lifeIntentId
        ? `/my/life/${input.request.lifeIntentId}`
        : "/my/life",
      description:
        "Use standard MapAble services and human support without automated mission planning.",
    },
    authorityCeiling: input.context.authorityCeiling,
    approvalBindings: input.context.approvalBindings,
    activeAgentIds: input.context.activeAgentIds,
    traceId: input.request.traceId,
    createdAt: now,
    updatedAt: now,
    planVersion: 1,
    basedOnVersion: null,
    changeReason: "Initial plan",
  };
}
