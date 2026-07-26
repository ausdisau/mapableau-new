import { randomUUID } from "crypto";

/**
 * Minimal mission registry for Wave 5 calibration.
 * Full Agent OS mission graph remains deferred — this store only holds
 * participant ownership + plan metadata needed by recordOutcome / compare.
 */

export type AuraMissionRecord = {
  id: string;
  participantId: string;
  correlationId: string;
  unknowns: string[];
  plan: { id: string; unknowns?: string[] } | null;
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

/** Test / calibration helper — register a lightweight mission owned by a participant. */
export function registerCalibrationMission(input: {
  id?: string;
  participantId: string;
  unknowns?: string[];
  planId?: string;
}): AuraMissionRecord {
  const id = input.id ?? randomUUID();
  const planId = input.planId ?? `plan-${id}`;
  const record: AuraMissionRecord = {
    id,
    participantId: input.participantId,
    correlationId: randomUUID(),
    unknowns: input.unknowns ?? [],
    plan: { id: planId, unknowns: input.unknowns ?? [] },
    planVersions: [{ version: 1, planId }],
    createdAt: new Date().toISOString(),
  };
  missions.set(id, record);
  return record;
}
