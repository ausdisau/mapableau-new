import { randomUUID } from "crypto";

import {
  requireMission,
  saveMission,
  type AuraMissionRecord,
} from "@/lib/aura/mission/store";
import { appendWitness } from "@/lib/aura/witness";

export type AuraStopReceipt = {
  id: string;
  missionId: string;
  userId: string;
  requestedAt: string;
  completedAt: string;
  result: "stopped";
  auditCorrelationId: string;
};

const stopReceipts = new Map<string, AuraStopReceipt>();

export function resetStopRegistry(): void {
  stopReceipts.clear();
}

export function assertMissionNotStopped(mission: AuraMissionRecord): void {
  if (
    mission.stopState ||
    mission.status === "stopped" ||
    mission.stopPhase === "stopped" ||
    mission.stopPhase === "stopping"
  ) {
    throw new Error("AURA_MISSION_STOPPED");
  }
}

/** Idempotent Stop AURA for Pocket sync. */
export function executeStopAura(input: {
  missionId: string;
  userId: string;
}): {
  mission: AuraMissionRecord;
  receipt: AuraStopReceipt;
} {
  const mission = requireMission(input.missionId);
  if (mission.participantId !== input.userId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }

  const existing = stopReceipts.get(input.missionId);
  if ((mission.stopState || mission.status === "stopped") && existing) {
    return { mission, receipt: existing };
  }

  const receipt: AuraStopReceipt = {
    id: randomUUID(),
    missionId: input.missionId,
    userId: input.userId,
    requestedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    result: "stopped",
    auditCorrelationId: mission.correlationId,
  };
  stopReceipts.set(input.missionId, receipt);

  const stopped = saveMission({
    ...mission,
    status: "stopped",
    stopState: true,
    stopPhase: "stopped",
  });

  appendWitness({
    missionId: mission.id,
    type: "mission.stopped",
    summary: "Stop AURA completed",
    correlationId: mission.correlationId,
    actorType: "participant",
    actorId: input.userId,
    payload: { receiptId: receipt.id },
  });

  return { mission: stopped, receipt };
}

export function stopAuraMission(missionId: string, userId: string): AuraMissionRecord {
  return executeStopAura({ missionId, userId }).mission;
}
