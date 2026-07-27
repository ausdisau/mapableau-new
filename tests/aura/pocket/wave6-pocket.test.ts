import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  registerCalibrationMission,
  requireMission,
  resetMissionStore,
} from "@/lib/aura/mission/store";
import {
  assertSnapshotAccess,
  buildMissionSnapshot,
  deleteSnapshot,
  hashUserId,
  listSnapshots,
  queueOfflineStop,
  queueSyncOperation,
  processSyncQueue,
  rejectOfflineExecutionApproval,
  resetPocketStorage,
  resetPocketSyncStore,
  saveSnapshot,
} from "@/lib/aura/pocket";
import { resetStopRegistry } from "@/lib/aura/stop";
import { resetWitnessStore } from "@/lib/aura/witness";

function resetAll() {
  resetMissionStore();
  resetWitnessStore();
  resetPocketStorage();
  resetPocketSyncStore();
  resetStopRegistry();
}

describe("Wave 6 — Pocket storage and sync", () => {
  beforeEach(() => {
    process.env.MAPABLE_AURA_ENABLED = "true";
    process.env.MAPABLE_AURA_POCKET_ENABLED = "true";
    process.env.MAPABLE_AURA_OFFLINE_RUNTIME_ENABLED = "true";
    resetAll();
  });

  afterEach(() => {
    resetAll();
    delete process.env.MAPABLE_AURA_ENABLED;
    delete process.env.MAPABLE_AURA_POCKET_ENABLED;
    delete process.env.MAPABLE_AURA_OFFLINE_RUNTIME_ENABLED;
  });

  it("indexes snapshots by hashed user id", () => {
    const mission = registerCalibrationMission({
      participantId: "participant-taylor",
    });
    const snap = buildMissionSnapshot({
      missionId: mission.id,
      userId: mission.participantId,
    });
    expect(snap.userIdHash).toBe(hashUserId("participant-taylor"));
    expect(snap.userIdHash).not.toBe("participant-taylor");
    expect(() => assertSnapshotAccess("other-user", snap)).toThrow(
      /AURA_POCKET_SNAPSHOT_FORBIDDEN/,
    );
  });

  it("preserves original createdAt on saveSnapshot update", () => {
    const mission = registerCalibrationMission({
      participantId: "p1",
    });
    const first = buildMissionSnapshot({
      missionId: mission.id,
      userId: "p1",
    });
    const originalCreatedAt = first.createdAt;
    const updated = saveSnapshot("p1", {
      ...first,
      syncState: "local_changes",
      stopped: true,
    });
    expect(updated.createdAt).toBe(originalCreatedAt);
    expect(updated.stopped).toBe(true);
  });

  it("prioritises stop_receipt and does not block deletion when rejecting offline execution approvals", () => {
    const mission = registerCalibrationMission({ participantId: "p1" });
    const snap = buildMissionSnapshot({
      missionId: mission.id,
      userId: "p1",
    });

    queueSyncOperation({
      userId: "p1",
      type: "execution_approval",
      payloadRef: "approval-1",
    });
    queueOfflineStop({
      userId: "p1",
      missionId: mission.id,
      snapshotId: snap.id,
    });
    queueSyncOperation({
      userId: "p1",
      type: "deletion",
      payloadRef: snap.id,
    });

    const result = processSyncQueue({
      userId: "p1",
      rejectOfflineExecutionApproval: true,
    });

    expect(requireMission(mission.id).status).toBe("stopped");
    expect(result.rejected.length).toBeGreaterThanOrEqual(1);
    expect(result.synced.length).toBeGreaterThanOrEqual(2);
    expect(listSnapshots("p1")).toHaveLength(0);
  });

  it("rejects offline execution approval helper", () => {
    expect(() => rejectOfflineExecutionApproval()).toThrow(
      /AURA_OFFLINE_EXECUTION_APPROVAL_REJECTED/,
    );
  });

  it("deleteSnapshot removes from list", () => {
    const mission = registerCalibrationMission({ participantId: "p1" });
    const snap = buildMissionSnapshot({
      missionId: mission.id,
      userId: "p1",
    });
    expect(deleteSnapshot("p1", snap.id)).toBe(true);
    expect(listSnapshots("p1")).toHaveLength(0);
  });
});

describe("Wave 6 — MAPABLE_AURA_DISABLED gate", () => {
  it("isAuraDisabledResponse is true when master flag off", async () => {
    delete process.env.MAPABLE_AURA_ENABLED;
    delete process.env.MAPABLE_AURA_DEMO;
    const { isAuraDisabledResponse } = await import(
      "@/lib/aura/feature-flags"
    );
    expect(isAuraDisabledResponse()).toBe(true);
  });
});
