import { afterEach, describe, expect, it } from "vitest";

import {
  assertLocalOnlyNoCloud,
  assertNotPlainLocalStorage,
  assertSnapshotAccess,
  buildMissionSnapshot,
  createAndPlanMission,
  deleteAllSnapshotsForUser,
  detectPocketCapabilities,
  evaluateWave6ReleaseGate,
  listSnapshots,
  processSyncQueue,
  queueOfflineStop,
  rejectOfflineExecutionApproval,
  requireMission,
  resetGuardianStore,
  resetLeaseStore,
  resetMissionStore,
  resetMultimodalStore,
  resetPocketStorage,
  resetPocketSyncStore,
  resetProposalStore,
  resetStopRegistry,
  resetWitnessStore,
  saveSnapshot,
  selectInferenceProvider,
  setWave6ReleaseGatePassed,
  stopAuraMission,
} from "@/lib/aura";

function resetAll() {
  resetMissionStore();
  resetLeaseStore();
  resetWitnessStore();
  resetPocketStorage();
  resetPocketSyncStore();
  resetMultimodalStore();
  resetStopRegistry();
  resetProposalStore();
  resetGuardianStore();
}

afterEach(resetAll);

function taylor() {
  const res = createAndPlanMission({
    goal: "Attend interview Room 3.12 at 10:00",
    selectedModules: ["access", "access_passport", "transport", "core_calendar"],
    placeId: "place-harbour-civic",
    scenarioId: "taylor-harbour-interview",
    userId: "demo-participant-taylor",
  });
  return { res, mission: requireMission(res.missionId) };
}

describe("Wave 6 — Pocket capabilities", () => {
  it("unsupported browser reports not_supported for on-device AI", () => {
    const caps = detectPocketCapabilities({ platform: "browser" });
    const ai = caps.find((c) => c.capability === "local_image_description");
    expect(ai?.state).toBe("not_supported");
  });

  it("local-only mode never selects cloud", () => {
    const sel = selectInferenceProvider({ requestedMode: "local_only" });
    assertLocalOnlyNoCloud(sel);
    expect(sel.selectedProvider).not.toBe("cloud");
  });

  it("no-AI mode uses deterministic services", () => {
    const sel = selectInferenceProvider({ requestedMode: "no_ai" });
    expect(sel.selectedProvider).toBe("deterministic");
  });

  it("plain localStorage forbidden for sensitive snapshots", () => {
    expect(assertNotPlainLocalStorage()).toBe(true);
  });
});

describe("Wave 6 — offline snapshots", () => {
  it("snapshot is user scoped and omits diagnosis", () => {
    const { mission } = taylor();
    const snap = buildMissionSnapshot({
      missionId: mission.id,
      userId: mission.participantId,
    });
    expect(snap.route?.instructions.length).toBeGreaterThan(0);
    expect(snap.unknowns.length).toBeGreaterThan(0);
    expect(snap).not.toHaveProperty("diagnosis");
    expect(snap).not.toHaveProperty("fullAccessPassport");
    expect(() =>
      assertSnapshotAccess("other-user", snap),
    ).toThrow("AURA_POCKET_SNAPSHOT_FORBIDDEN");
  });

  it("delete offline data works", () => {
    const { mission } = taylor();
    buildMissionSnapshot({ missionId: mission.id, userId: mission.participantId });
    expect(listSnapshots(mission.participantId).length).toBe(1);
    expect(deleteAllSnapshotsForUser(mission.participantId)).toBe(1);
    expect(listSnapshots(mission.participantId).length).toBe(0);
  });
});

describe("Wave 6 — offline stop and sync", () => {
  it("offline stop queues receipt and sync applies stop", () => {
    const { mission } = taylor();
    const snap = buildMissionSnapshot({
      missionId: mission.id,
      userId: mission.participantId,
    });
    queueOfflineStop({
      userId: mission.participantId,
      missionId: mission.id,
      snapshotId: snap.id,
    });
    const result = processSyncQueue({
      userId: mission.participantId,
      rejectOfflineExecutionApproval: true,
    });
    expect(result.synced.length).toBeGreaterThan(0);
    expect(requireMission(mission.id).status).toBe("stopped");
  });

  it("offline execution approval is rejected", () => {
    expect(() => rejectOfflineExecutionApproval()).toThrow(
      "AURA_OFFLINE_EXECUTION_APPROVAL_REJECTED",
    );
  });

  it("repeated offline stop is idempotent via server stop", () => {
    const { mission } = taylor();
    stopAuraMission(mission.id, mission.participantId);
    stopAuraMission(mission.id, mission.participantId);
    expect(requireMission(mission.id).status).toBe("stopped");
  });
});

describe("Wave 6 — release gate", () => {
  it("passes with test defaults", () => {
    setWave6ReleaseGatePassed(true);
    const gate = evaluateWave6ReleaseGate();
    expect(gate.passed).toBe(true);
  });
});
