import { randomUUID } from "crypto";

import {
  AURA_WAVE1_AUTHORITY_CEILING,
  type AuraAuthorityLevel,
} from "../authority/ladder";
import { issueLeases, listActiveLeases, revokeAllLeases } from "../leases";
import {
  createAuraMissionInputSchema,
  type AuraMissionGraph,
  type AuraMissionState,
  type AuraModule,
  type AuraProofPlan,
  type AuraVerifierResult,
  type CreateAuraMissionInput,
} from "../schemas";
import type { WitnessEvent } from "../witness";
import { appendWitness, listWitness } from "../witness";

export type AuraMissionRecord = {
  id: string;
  requestId: string;
  participantId: string;
  tenantId?: string;
  missionType: string;
  desiredOutcome: string;
  status: AuraMissionState;
  modules: AuraModule[];
  accessibilityProfileOptIn: boolean;
  selectedPassportId: string | null;
  placeId: string;
  scenarioId: string | null;
  freeText: string | null;
  authorityLevel: AuraAuthorityLevel;
  authorityCeiling: AuraAuthorityLevel;
  stopState: boolean;
  stopPhase:
    | "not_stopped"
    | "stop_requested"
    | "stopping"
    | "stopped"
    | "stop_failed_requires_review";
  stopReceiptId: string | null;
  planVersions: Array<{
    version: number;
    planId: string;
    previousPlanId: string | null;
    reason: string;
    createdAt: string;
    simulated: boolean;
  }>;
  challengeCountByPlan: Record<string, number>;
  resilience: unknown | null;
  graph: AuraMissionGraph;
  knownFacts: string[];
  unknowns: string[];
  blockers: string[];
  conditions: string[];
  alternatives: string[];
  plan: AuraProofPlan | null;
  verifier: AuraVerifierResult | null;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  lastVerifiedAt: string | null;
};

const missions = new Map<string, AuraMissionRecord>();

export function resetMissionStore(): void {
  missions.clear();
}

export function getMission(missionId: string): AuraMissionRecord | null {
  return missions.get(missionId) ?? null;
}

export function requireMission(missionId: string): AuraMissionRecord {
  const m = getMission(missionId);
  if (!m) throw new Error("AURA_MISSION_NOT_FOUND");
  return m;
}

export function createMissionDraft(
  raw: CreateAuraMissionInput,
): AuraMissionRecord {
  const input = createAuraMissionInputSchema.parse(raw);

  if (
    input.accessibilityProfileOptIn !== true &&
    input.selectedModules.includes("accessibility_profile")
  ) {
    throw new Error("AURA_ACCESSIBILITY_PROFILE_OPT_IN_REQUIRED");
  }

  const modules = input.selectedModules.filter((m) => {
    if (m === "accessibility_profile" && !input.accessibilityProfileOptIn) {
      return false;
    }
    return true;
  });

  const id = randomUUID();
  const correlationId = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();

  const mission: AuraMissionRecord = {
    id,
    requestId: `aura-${id}`,
    participantId: input.userId,
    tenantId: input.tenantId,
    missionType: input.missionType,
    desiredOutcome: input.goal,
    status: "collecting_context",
    modules,
    accessibilityProfileOptIn: input.accessibilityProfileOptIn === true,
    selectedPassportId: input.selectedPassportId ?? null,
    placeId: input.placeId,
    scenarioId: input.scenarioId ?? null,
    freeText: input.freeText ?? null,
    authorityLevel: "L2_RECOMMEND",
    authorityCeiling: AURA_WAVE1_AUTHORITY_CEILING,
    stopState: false,
    stopPhase: "not_stopped",
    stopReceiptId: null,
    planVersions: [],
    challengeCountByPlan: {},
    resilience: null,
    graph: { nodes: [], edges: [] },
    knownFacts: [],
    unknowns: [],
    blockers: [],
    conditions: [],
    alternatives: [],
    plan: null,
    verifier: null,
    correlationId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt,
    lastVerifiedAt: null,
  };

  missions.set(id, mission);

  issueLeases({
    missionId: id,
    userId: input.userId,
    modules,
    resourceScope: [input.placeId],
    correlationId,
  });

  appendWitness({
    missionId: id,
    type: "mission_created",
    summary: "Accessibility mission draft created",
    correlationId,
    payload: {
      modules,
      accessibilityProfileOptIn: mission.accessibilityProfileOptIn,
      authorityCeiling: mission.authorityCeiling,
    },
  });

  return mission;
}

export function saveMission(mission: AuraMissionRecord): AuraMissionRecord {
  const next = { ...mission, updatedAt: new Date().toISOString() };
  missions.set(next.id, next);
  return next;
}

export function stopMission(
  missionId: string,
  userId: string,
): {
  mission: AuraMissionRecord;
  revokedLeaseCount: number;
  witness: WitnessEvent[];
} {
  const mission = requireMission(missionId);
  if (mission.participantId !== userId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }

  const revoked = revokeAllLeases(missionId, "participant_stop");
  const next = saveMission({
    ...mission,
    status: "stopped",
    stopState: true,
    authorityLevel: "L0_OBSERVE",
  });

  appendWitness({
    missionId,
    type: "mission_stopped",
    summary: "Participant stopped AURA; leases revoked; proposals invalidated",
    correlationId: mission.correlationId,
    payload: {
      revokedLeaseCount: revoked.length,
      activeLeasesAfter: listActiveLeases(missionId).length,
    },
  });

  return {
    mission: next,
    revokedLeaseCount: revoked.length,
    witness: listWitness(missionId),
  };
}

export function listMissionsForUser(userId: string): AuraMissionRecord[] {
  return [...missions.values()].filter((m) => m.participantId === userId);
}
