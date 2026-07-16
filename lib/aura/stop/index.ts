import { randomUUID } from "crypto";

import { revokeAllLeases, listActiveLeases } from "../leases";
import type { AuraMissionRecord } from "../mission/store";
import { requireMission, saveMission } from "../mission/store";
import { appendWitness, listWitness } from "../witness";

export type AuraStopState =
  | "not_stopped"
  | "stop_requested"
  | "stopping"
  | "stopped"
  | "stop_failed_requires_review";

export type AuraStopReceipt = {
  id: string;
  missionId: string;
  userId: string;
  requestedAt: string;
  completedAt: string;
  revokedCapabilityLeaseIds: string[];
  cancelledRunIds: string[];
  invalidatedProposalIds: string[];
  preservedRecordTypes: string[];
  auditCorrelationId: string;
  result: "stopped" | "partially_stopped_human_review_required";
  notes: string[];
};

/** Per-mission AbortControllers for in-flight runs. */
const abortRegistry = new Map<string, AbortController>();
const cancelledRunIds = new Map<string, string[]>();
const stopReceipts = new Map<string, AuraStopReceipt>();

export function resetStopRegistry(): void {
  for (const c of abortRegistry.values()) {
    try {
      c.abort();
    } catch {
      /* ignore */
    }
  }
  abortRegistry.clear();
  cancelledRunIds.clear();
  stopReceipts.clear();
}

export function getOrCreateAbortController(missionId: string): AbortController {
  const existing = abortRegistry.get(missionId);
  if (existing && !existing.signal.aborted) return existing;
  const next = new AbortController();
  abortRegistry.set(missionId, next);
  return next;
}

export function getAbortSignal(missionId: string): AbortSignal | undefined {
  return abortRegistry.get(missionId)?.signal;
}

export function registerRunId(missionId: string, runId: string): void {
  const list = cancelledRunIds.get(missionId) ?? [];
  // track active runs separately — cancelled list filled on stop
  cancelledRunIds.set(missionId, list);
  void runId;
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

export function discardIfStopped<T>(
  missionId: string,
  result: T,
): T | { discarded: true; reason: "mission_stopped" } {
  const mission = requireMission(missionId);
  if (mission.stopState || mission.status === "stopped") {
    appendWitness({
      missionId,
      type: "plan.cancelled",
      summary: "Late result discarded after Stop AURA",
      correlationId: mission.correlationId,
      payload: { discarded: true },
    });
    return { discarded: true, reason: "mission_stopped" };
  }
  return result;
}

/**
 * Idempotent Stop AURA.
 * Does not accept client-supplied authority. Preserves plans + audit.
 */
export function executeStopAura(input: { missionId: string; userId: string }): {
  mission: AuraMissionRecord;
  receipt: AuraStopReceipt;
  witnessCount: number;
} {
  const mission = requireMission(input.missionId);
  if (mission.participantId !== input.userId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }

  // Idempotent: already stopped
  const existing = stopReceipts.get(input.missionId);
  if ((mission.stopState || mission.status === "stopped") && existing) {
    return {
      mission,
      receipt: existing,
      witnessCount: listWitness(input.missionId).length,
    };
  }

  const requestedAt = new Date().toISOString();
  const stopping = saveMission({
    ...mission,
    stopPhase: "stopping",
    status: mission.status === "stopped" ? "stopped" : mission.status,
  });

  appendWitness({
    missionId: input.missionId,
    type: "mission.stop_requested",
    summary: "Participant requested Stop AURA",
    correlationId: mission.correlationId,
    actorType: "participant",
    actorId: input.userId,
  });

  // Abort active streams / runs
  const controller = abortRegistry.get(input.missionId);
  const cancelled: string[] = [];
  if (controller && !controller.signal.aborted) {
    controller.abort();
    cancelled.push(`abort-${input.missionId}`);
  }
  const prevCancelled = cancelledRunIds.get(input.missionId) ?? [];
  cancelledRunIds.set(input.missionId, [...prevCancelled, ...cancelled]);

  const activeBefore = listActiveLeases(input.missionId);
  const revoked = revokeAllLeases(input.missionId, "participant_stop");

  const completedAt = new Date().toISOString();
  const receipt: AuraStopReceipt = {
    id: existing?.id ?? randomUUID(),
    missionId: input.missionId,
    userId: input.userId,
    requestedAt: existing?.requestedAt ?? requestedAt,
    completedAt,
    revokedCapabilityLeaseIds: revoked.map((l) => l.id),
    cancelledRunIds: cancelledRunIds.get(input.missionId) ?? [],
    invalidatedProposalIds: [], // Wave 3+
    preservedRecordTypes: [
      "CareOSMission",
      "AuraProofPlan",
      "AuraPlanVersion",
      "WitnessEvent",
      "AuraCounterfactualRun",
    ],
    auditCorrelationId: mission.correlationId,
    result: "stopped",
    notes: [
      "AURA cannot continue reading information or generating plans for this mission.",
      "Completed MapAble records and audit history were not deleted.",
      `Revoked ${revoked.length} capability lease(s); ${activeBefore.length} were active.`,
    ],
  };
  stopReceipts.set(input.missionId, receipt);

  const stopped = saveMission({
    ...stopping,
    status: "stopped",
    stopState: true,
    stopPhase: "stopped",
    authorityLevel: "L0_OBSERVE",
    stopReceiptId: receipt.id,
  });

  appendWitness({
    missionId: input.missionId,
    type: "mission.stopped",
    summary: "AURA stopped; leases revoked; generation aborted",
    correlationId: mission.correlationId,
    actorType: "system",
    actorId: "aura.stop",
    payload: {
      receiptId: receipt.id,
      revokedLeaseCount: revoked.length,
      cancelledRunCount: receipt.cancelledRunIds.length,
      // never full passport
    },
  });

  for (const lease of revoked) {
    appendWitness({
      missionId: input.missionId,
      type: "capability.lease_revoked",
      summary: `Lease revoked: ${lease.capabilityId}`,
      correlationId: mission.correlationId,
      payload: { leaseId: lease.id, capabilityId: lease.capabilityId },
    });
  }

  return {
    mission: stopped,
    receipt,
    witnessCount: listWitness(input.missionId).length,
  };
}

export function getStopReceipt(missionId: string): AuraStopReceipt | null {
  return stopReceipts.get(missionId) ?? null;
}
