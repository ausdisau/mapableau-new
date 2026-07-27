import { randomUUID } from "crypto";

/**
 * Minimal mission registry for Wave 5 calibration + Wave 6 Pocket.
 * Full Agent OS mission graph remains deferred.
 */

export type AuraMissionRecord = {
  id: string;
  participantId: string;
  correlationId: string;
  status: string;
  stopState: boolean;
  stopPhase: "not_stopped" | "stopping" | "stopped";
  desiredOutcome: string;
  placeId: string;
  unknowns: string[];
  knownFacts: string[];
  blockers: string[];
  conditions: string[];
  plan: {
    id: string;
    unknowns?: string[];
    recommendedRoute?: {
      entranceLabel?: string;
      liftLabel?: string;
    };
    evidence?: Array<{
      evidenceId: string;
      sourceType?: string;
      observedAt: string;
      confidence?: number;
    }>;
  } | null;
  planVersions: Array<{ version: number; planId: string }>;
  createdAt: string;
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

export function saveMission(mission: AuraMissionRecord): AuraMissionRecord {
  missions.set(mission.id, mission);
  return mission;
}

/** Test / calibration / pocket helper — register a lightweight mission. */
export function registerCalibrationMission(input: {
  id?: string;
  participantId: string;
  unknowns?: string[];
  planId?: string;
  desiredOutcome?: string;
  placeId?: string;
}): AuraMissionRecord {
  const id = input.id ?? randomUUID();
  const planId = input.planId ?? `plan-${id}`;
  const record: AuraMissionRecord = {
    id,
    participantId: input.participantId,
    correlationId: randomUUID(),
    status: "planned",
    stopState: false,
    stopPhase: "not_stopped",
    desiredOutcome: input.desiredOutcome ?? "Attend venue visit",
    placeId: input.placeId ?? "place-demo",
    unknowns: input.unknowns ?? ["toilet availability"],
    knownFacts: ["Entrance B is step-free"],
    blockers: [],
    conditions: ["Arrive early if possible"],
    plan: {
      id: planId,
      unknowns: input.unknowns ?? ["toilet availability"],
      recommendedRoute: {
        entranceLabel: "Entrance B",
        liftLabel: "western lift",
      },
      evidence: [
        {
          evidenceId: "ev-entrance-b",
          sourceType: "community",
          observedAt: new Date().toISOString(),
          confidence: 0.8,
        },
      ],
    },
    planVersions: [{ version: 1, planId }],
    createdAt: new Date().toISOString(),
  };
  missions.set(id, record);
  return record;
}
