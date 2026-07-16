import { challengePlan } from "../challenge";
import { auraFlags, auraMaxAuthorityLevel } from "../feature-flags";
import { listActiveLeases } from "../leases";
import {
  createMissionDraft,
  getMission,
  requireMission,
  saveMission,
  stopMission,
} from "../mission/store";
import {
  runTaylorHarbourPlan,
  TAYLOR_SCENARIO_ID,
} from "../scenarios/taylor-harbour";
import {
  createAuraMissionInputSchema,
  type AuraResponse,
  type CreateAuraMissionInput,
} from "../schemas";
import { listWitness } from "../witness";

export function createAndPlanMission(raw: CreateAuraMissionInput): AuraResponse {
  if (!auraFlags.enabled && process.env.NODE_ENV !== "test") {
    // Allow tests and explicit demo when flag off via test env; APIs still gate.
  }
  const parsed = createAuraMissionInputSchema.parse(raw);

  // Accessibility profile remains off unless explicit opt-in
  const input = {
    ...parsed,
    selectedModules: parsed.accessibilityProfileOptIn
      ? parsed.selectedModules
      : parsed.selectedModules.filter((m) => m !== "accessibility_profile"),
  };

  const draft = createMissionDraft(input);

  const scenarioId = input.scenarioId ?? TAYLOR_SCENARIO_ID;
  if (
    scenarioId === TAYLOR_SCENARIO_ID ||
    input.placeId === "place-harbour-civic"
  ) {
    const { mission, response } = runTaylorHarbourPlan(draft);
    saveMission(mission);
    return response;
  }

  // Generic empty plan path (no writes)
  const leases = listActiveLeases(draft.id);
  const response: AuraResponse = {
    missionId: draft.id,
    missionState: draft.status,
    goal: draft.desiredOutcome,
    authority: {
      currentLevel: "L0_OBSERVE",
      maximumLevel: auraMaxAuthorityLevel(),
      activeCapabilityCount: leases.length,
    },
    knownFacts: [],
    unknowns: ["Destination evidence not loaded for this place."],
    blockers: [],
    conditions: [],
    alternatives: [],
    missionGraph: { nodes: [], edges: [] },
    missionGraphSummary: {
      nodeCount: 0,
      dependencyCount: 0,
      unresolvedDependencyCount: 0,
    },
    proposedActions: [],
    humanReview: { required: false },
    nonAiRoutes: [
      { label: "Access map", href: "/access" },
      { label: "Ask MapAble (standard)", href: "/ask" },
    ],
    modules: {
      selected: draft.modules,
      denied: [],
      unavailable: draft.accessibilityProfileOptIn
        ? []
        : ["accessibility_profile"],
      accessibilityProfileOptIn: draft.accessibilityProfileOptIn,
    },
    lastCheckedAt: new Date().toISOString(),
    syntheticDemo: true,
  };
  return response;
}

export function getMissionResponse(missionId: string): AuraResponse {
  const mission = requireMission(missionId);
  const leases = listActiveLeases(missionId);
  return {
    missionId: mission.id,
    missionState: mission.status,
    goal: mission.desiredOutcome,
    authority: {
      currentLevel: mission.stopState ? "L0_OBSERVE" : mission.authorityLevel,
      maximumLevel: mission.authorityCeiling,
      activeCapabilityCount: leases.length,
      expiresAt: leases[0]?.expiresAt,
    },
    plan: mission.plan ?? undefined,
    verifier: mission.verifier ?? undefined,
    knownFacts: mission.knownFacts,
    unknowns: mission.unknowns,
    blockers: mission.blockers,
    conditions: mission.conditions,
    alternatives: mission.alternatives,
    missionGraph: mission.graph,
    missionGraphSummary: {
      nodeCount: mission.graph.nodes.length,
      dependencyCount: mission.graph.edges.length,
      unresolvedDependencyCount: mission.graph.nodes.filter(
        (n) => n.status === "unknown",
      ).length,
    },
    proposedActions: [],
    humanReview: { required: mission.status === "human_review_required" },
    nonAiRoutes: [
      { label: "Access map", href: "/access" },
      {
        label: "Access Intelligence visit plans",
        href: "/access-intelligence/visit-plans",
      },
      { label: "Verify my venue (standard)", href: "/verify-my-venue" },
    ],
    modules: {
      selected: mission.modules,
      denied: [],
      unavailable: mission.accessibilityProfileOptIn
        ? []
        : ["accessibility_profile"],
      accessibilityProfileOptIn: mission.accessibilityProfileOptIn,
    },
    lastCheckedAt: mission.lastVerifiedAt ?? mission.updatedAt,
    syntheticDemo: true,
  };
}

export function stopAuraMission(missionId: string, userId: string) {
  const result = stopMission(missionId, userId);
  return {
    ...result,
    response: getMissionResponse(missionId),
  };
}

export function challengeMissionPlan(missionId: string) {
  const mission = requireMission(missionId);
  if (!mission.plan) throw new Error("AURA_PLAN_MISSING");
  if (mission.stopState) throw new Error("AURA_MISSION_STOPPED");
  return challengePlan(mission.plan);
}

export function getMissionAudit(missionId: string) {
  requireMission(missionId);
  return listWitness(missionId);
}

export { getMission };
