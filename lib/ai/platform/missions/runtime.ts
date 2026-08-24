import { randomUUID } from "node:crypto";

import {
  createMapAbleMissionContext,
  selectMapAbleAgents,
} from "@/lib/ai/platform/agents";
import type { MapAbleAgentActivationEntry } from "@/lib/ai/platform/agents/types";
import { evaluateSafeguardingGate } from "@/lib/ai/platform/policies/safeguarding-gate";
import { mergeFabricContextIntoEvidence } from "@/lib/ai/platform/context-fabric/mission-bridge";
import { ensureMissionRecoveryTracking } from "@/lib/ai/platform/recovery/planner";
import { agenticNerveCentreConfig } from "@/lib/config/agentic-nerve-centre";
import { isAdaptiveRecoveryEnabled } from "@/lib/config/adaptive-recovery";

import { compileMissionPlan } from "./compiler";
import { analyseMissionContinuity } from "./continuity";
import { buildMissionEvidenceBundle } from "./evidence";
import { buildMissionGraph } from "./graph";
import { routeMissionDomains } from "./router";
import { saveMissionPlan, getMissionPlan } from "./store";
import { captureMissionTelemetry } from "./telemetry";
import type {
  MapAbleMissionPlan,
  MapAbleMissionRequest,
  MapAbleMissionRuntimeContext,
} from "./types";

function createTraceId(): string {
  return randomUUID();
}

function buildRuntimeContext(input: {
  request: MapAbleMissionRequest;
  activation: ReturnType<typeof selectMapAbleAgents>;
  activeAgents: MapAbleAgentActivationEntry[];
}): MapAbleMissionRuntimeContext {
  const base = createMapAbleMissionContext({
    missionId: input.request.missionId,
    actor: {
      actorId: input.request.actorId,
      actorType: "participant",
    },
    participantId: input.request.participantId,
    objective: input.request.objective,
    domains: input.request.requestedDomains ?? ["core"],
    consentScopes: input.request.consentScopes,
    communicationPreferences: input.request.communicationPreferences ?? [],
    evidenceRefs: input.request.lifeIntentId
      ? [`life_intent:${input.request.lifeIntentId}`]
      : [],
    activeAgentIds: input.activeAgents.map((a) => a.id),
    authorityCeiling: input.activation.authorityCeiling,
    featureFlags: {
      MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED: agenticNerveCentreConfig.enabled,
    },
    humanReviewItems: input.activation.requiredHumanReviews,
    traceId: input.request.traceId,
  });

  const profileUsed =
    input.request.requestedUseOfAccessibilityProfile === true &&
    input.request.profileConsentGranted === true;

  return {
    ...base,
    approvedObjective: input.request.objective,
    source: input.request.source,
    lifeIntentId: input.request.lifeIntentId ?? null,
    requestedUseOfAccessibilityProfile:
      input.request.requestedUseOfAccessibilityProfile,
    plainLanguage: input.request.plainLanguage,
    activeCapabilities: input.activeAgents.flatMap((a) => a.capabilityKeys),
    missingEvidence: [],
    conflictingEvidence: [],
    routing: routeMissionDomains({
      objective: input.request.objective,
      requestedDomains: input.request.requestedDomains,
      addedDomains: input.request.addedDomains,
      removedDomains: input.request.removedDomains,
      source: input.request.source,
    }),
    profileUsed,
  };
}

export function planMission(input: Omit<MapAbleMissionRequest, "missionId" | "traceId"> & {
  missionId?: string;
  traceId?: string;
  rejectedRecommendationIds?: string[];
}): MapAbleMissionPlan {
  if (!agenticNerveCentreConfig.enabled) {
    throw new Error("AGENTIC_NERVE_CENTRE_DISABLED");
  }

  const missionId = input.missionId ?? randomUUID();
  const traceId = input.traceId ?? createTraceId();

  const request: MapAbleMissionRequest = {
    ...input,
    missionId,
    traceId,
  };

  captureMissionTelemetry({
    kind: "mission_started",
    missionId,
    traceId,
  });

  const routing = routeMissionDomains({
    objective: request.objective,
    requestedDomains: request.requestedDomains,
    addedDomains: request.addedDomains,
    removedDomains: request.removedDomains,
    source: request.source,
  });

  captureMissionTelemetry({
    kind: "mission_routed",
    missionId,
    traceId,
    reason: routing.allowedDomains.join(","),
  });

  const safeguarding = evaluateSafeguardingGate({
    objective: request.objective,
    domains: routing.allowedDomains,
    traceId,
  });

  const activation = selectMapAbleAgents({
    objective: request.objective,
    domains: routing.allowedDomains,
    actor: {
      actorId: request.actorId,
      actorType: "participant",
    },
    consentScopes: request.consentScopes,
    includeContinuityAnalysis: routing.allowedDomains.length > 1,
  });

  if (safeguarding.halted) {
    activation.requiredHumanReviews.push(safeguarding.humanReviewItem);
    captureMissionTelemetry({
      kind: "human_review_requested",
      missionId,
      traceId,
      reason: "safeguarding",
    });
  }

  const activeAgents = activation.activeAgents;
  captureMissionTelemetry({
    kind: "agent_activated",
    missionId,
    traceId,
    reason: activeAgents.map((a) => a.id).join(","),
  });

  const context = buildRuntimeContext({
    request: { ...request, requestedDomains: routing.allowedDomains },
    activation,
    activeAgents,
  });
  context.routing = routing;
  context.domains = routing.allowedDomains;

  const evidence = mergeFabricContextIntoEvidence({
    missionId,
    participantId: request.participantId,
    actorId: request.actorId,
    consentScopes: request.consentScopes,
    evidence: buildMissionEvidenceBundle(request),
  });
  captureMissionTelemetry({
    kind: evidence.missing.length ? "evidence_missing" : "evidence_loaded",
    missionId,
    traceId,
  });

  const graph = buildMissionGraph({
    objective: request.objective,
    domains: routing.allowedDomains,
    profileUsed: context.profileUsed,
    profileConsentRequested: request.requestedUseOfAccessibilityProfile,
    profileConsentGranted: request.profileConsentGranted === true,
  });

  const continuityAlerts = analyseMissionContinuity(graph);
  for (const _alert of continuityAlerts) {
    captureMissionTelemetry({
      kind: "continuity_alert_created",
      missionId,
      traceId,
    });
  }

  const plan = compileMissionPlan({
    request,
    context,
    graph,
    evidence,
    continuityAlerts,
    humanReviewItems: activation.requiredHumanReviews,
    activeAgents,
    rejectedRecommendationIds: input.rejectedRecommendationIds ?? [],
  });

  for (const rec of plan.recommendations) {
    captureMissionTelemetry({
      kind: "recommendation_created",
      missionId,
      traceId,
      reason: rec.id,
    });
  }

  saveMissionPlan(plan);
  if (isAdaptiveRecoveryEnabled()) {
    ensureMissionRecoveryTracking(plan);
  }
  return plan;
}

export function replanMission(input: {
  missionId: string;
  actorId: string;
  participantId: string;
  objective?: string;
  addedDomains?: MapAbleMissionRequest["addedDomains"];
  removedDomains?: MapAbleMissionRequest["removedDomains"];
  rejectedRecommendationIds?: string[];
  requestedUseOfAccessibilityProfile?: boolean;
  profileConsentGranted?: boolean;
  selectNonAiPath?: boolean;
}): MapAbleMissionPlan {
  const existing = getMissionPlan(input.missionId);
  if (!existing) {
    throw new Error("MISSION_NOT_FOUND");
  }

  if (input.selectNonAiPath) {
    captureMissionTelemetry({
      kind: "non_ai_path_selected",
      missionId: input.missionId,
      traceId: existing.traceId,
    });
  }

  for (const id of input.rejectedRecommendationIds ?? []) {
    captureMissionTelemetry({
      kind: "participant_rejected_recommendation",
      missionId: input.missionId,
      traceId: existing.traceId,
      reason: id,
    });
  }

  return planMission({
    missionId: input.missionId,
    traceId: existing.traceId,
    actorId: input.actorId,
    participantId: input.participantId,
    objective: input.objective ?? existing.objective,
    requestedDomains: existing.domains,
    addedDomains: input.addedDomains,
    removedDomains: input.removedDomains,
    requestedUseOfAccessibilityProfile:
      input.requestedUseOfAccessibilityProfile ?? false,
    profileConsentGranted: input.profileConsentGranted,
    plainLanguage: true,
    consentScopes: [],
    source: "participant_text",
    rejectedRecommendationIds: input.rejectedRecommendationIds,
  });
}

export function previewMissionPlan(missionId: string): MapAbleMissionPlan | null {
  return getMissionPlan(missionId);
}
