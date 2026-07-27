import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  registerCalibrationMission,
  resetMissionStore,
} from "@/lib/aura/mission/store";
import { resetWitnessStore } from "@/lib/aura/witness";
import {
  buildJourneyWorld,
  getLatestWorld,
  listWorldVersions,
  propagateDependencyChange,
  resetWorldModelStore,
} from "@/lib/aura/world-model";

function resetAll() {
  resetMissionStore();
  resetWitnessStore();
  resetWorldModelStore();
}

describe("Wave 7 — journey world model", () => {
  beforeEach(() => {
    process.env.MAPABLE_AURA_WORLD_MODEL_ENABLED = "true";
    resetAll();
  });

  afterEach(() => {
    resetAll();
    delete process.env.MAPABLE_AURA_WORLD_MODEL_ENABLED;
  });

  it("composes journey with venue entrance and versions", () => {
    const m = registerCalibrationMission({
      participantId: "demo-participant-taylor",
      placeId: "place-harbour-civic",
    });
    const world = buildJourneyWorld({
      missionId: m.id,
      userId: m.participantId,
    });
    expect(world.nodes.some((n) => n.type === "venue_entrance")).toBe(true);
    expect(world.nodes.some((n) => n.canonicalId?.includes("place-harbour"))).toBe(
      true,
    );
    expect(world.version).toBe(1);
  });

  it("propagation requires world and versions prior state", () => {
    const m = registerCalibrationMission({ participantId: "p1" });
    expect(() =>
      propagateDependencyChange({
        missionId: m.id,
        changeType: "lift_outage",
        sourceObservationIds: [],
      }),
    ).toThrow(/AURA_WORLD_NOT_FOUND/);

    buildJourneyWorld({ missionId: m.id, userId: "p1" });
    const result = propagateDependencyChange({
      missionId: m.id,
      changeType: "lift_outage",
      sourceObservationIds: [],
    });
    expect(result.externalActionTaken).toBe(false);
    expect(result.newBlockers.length).toBeGreaterThan(0);
    expect(listWorldVersions(m.id).length).toBe(2);
    expect(getLatestWorld(m.id)?.version).toBe(2);
  });
});
