import { challengePlan, runBoundedPlanChallenge } from "../challenge";
import { runCounterfactual, listCounterfactuals } from "../counterfactual";
import {
  assertAuraCanStart,
  auraFlags,
  auraMaxAuthorityLevel,
} from "../feature-flags";
import { listActiveLeases } from "../leases";
import {
  createMissionDraft,
  getMission,
  requireMission,
  saveMission,
} from "../mission/store";
import {
  createOfflineVisitPack,
  deleteOfflinePack,
  getOfflinePack,
  listOfflinePacks,
  markPacksStopped,
  renderOfflinePackHtml,
} from "../offline";
import { assessPlanResilience, getResilience } from "../resilience";
import {
  runTaylorHarbourPlan,
  TAYLOR_SCENARIO_ID,
} from "../scenarios/taylor-harbour";
import {
  createAuraMissionInputSchema,
  type AuraResponse,
  type CreateAuraMissionInput,
} from "../schemas";
import {
  executeStopAura,
  getOrCreateAbortController,
  getStopReceipt,
} from "../stop";
import {
  buildAuditReplayManifest,
  listWitness,
  verifyWitnessChain,
} from "../witness";

export function createAndPlanMission(
  raw: CreateAuraMissionInput,
): AuraResponse {
  assertAuraCanStart();
  const parsed = createAuraMissionInputSchema.parse(raw);
  const input = {
    ...parsed,
    selectedModules: parsed.accessibilityProfileOptIn
      ? parsed.selectedModules
      : parsed.selectedModules.filter((m) => m !== "accessibility_profile"),
  };

  const draft = createMissionDraft(input);
  getOrCreateAbortController(draft.id);

  const scenarioId = input.scenarioId ?? TAYLOR_SCENARIO_ID;
  if (
    scenarioId === TAYLOR_SCENARIO_ID ||
    input.placeId === "place-harbour-civic"
  ) {
    const { mission } = runTaylorHarbourPlan(draft);
    // Plan version 1
    const withVersions = saveMission({
      ...mission,
      planVersions: [
        {
          version: 1,
          planId: mission.plan!.id,
          previousPlanId: null,
          reason: "initial_plan",
          createdAt: new Date().toISOString(),
          simulated: false,
        },
      ],
    });
    // Auto resilience for Wave 2
    try {
      if (auraFlags.resilience || process.env.NODE_ENV === "test") {
        assessPlanResilience(withVersions.id);
      }
    } catch {
      /* optional */
    }
    return getMissionResponse(withVersions.id);
  }

  const leases = listActiveLeases(draft.id);
  return {
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
  const result = executeStopAura({ missionId, userId });
  markPacksStopped(missionId);
  return {
    mission: result.mission,
    revokedLeaseCount: result.receipt.revokedCapabilityLeaseIds.length,
    witness: listWitness(missionId),
    receipt: result.receipt,
    response: getMissionResponse(missionId),
  };
}

export function challengeMissionPlan(missionId: string) {
  const mission = requireMission(missionId);
  if (!mission.plan) throw new Error("AURA_PLAN_MISSING");
  if (mission.stopState) throw new Error("AURA_MISSION_STOPPED");
  if (auraFlags.planChallenge || process.env.NODE_ENV === "test") {
    return runBoundedPlanChallenge(missionId);
  }
  return challengePlan(mission.plan);
}

export function getMissionAudit(missionId: string) {
  requireMission(missionId);
  return listWitness(missionId);
}

export function getMissionAuditReplay(missionId: string) {
  requireMission(missionId);
  if (!auraFlags.auditReplay && process.env.NODE_ENV !== "test") {
    throw new Error("MAPABLE_AURA_AUDIT_REPLAY_DISABLED");
  }
  return buildAuditReplayManifest(missionId);
}

export function verifyMissionAudit(missionId: string) {
  requireMission(missionId);
  return verifyWitnessChain(missionId);
}

export {
  getMission,
  runCounterfactual,
  listCounterfactuals,
  assessPlanResilience,
  getResilience,
  createOfflineVisitPack,
  listOfflinePacks,
  getOfflinePack,
  deleteOfflinePack,
  renderOfflinePackHtml,
  getStopReceipt,
  runBoundedPlanChallenge,
};
