import { afterEach, describe, expect, it } from "vitest";

import {
  buildJourneyWorld,
  createAndPlanMission,
  getLatestWorld,
  listWorldVersions,
  propagateDependencyChange,
  requireMission,
  resetGuardianStore,
  resetInteropStore,
  resetLeaseStore,
  resetMissionStore,
  resetSensorStore,
  resetStopRegistry,
  resetWitnessStore,
  resetWorldModelStore,
  setWave6ReleaseGatePassed,
} from "@/lib/aura";

function resetAll() {
  resetMissionStore();
  resetLeaseStore();
  resetWitnessStore();
  resetWorldModelStore();
  resetSensorStore();
  resetInteropStore();
  resetGuardianStore();
  resetStopRegistry();
}

afterEach(resetAll);

function mission() {
  const res = createAndPlanMission({
    goal: "Interview Room 3.12",
    selectedModules: ["access", "transport"],
    placeId: "place-harbour-civic",
    scenarioId: "taylor-harbour-interview",
    userId: "demo-participant-taylor",
  });
  return requireMission(res.missionId);
}

describe("Wave 7 — world model", () => {
  it("composes journey without duplicate places", () => {
    setWave6ReleaseGatePassed(true);
    const m = mission();
    const world = buildJourneyWorld({ missionId: m.id, userId: m.participantId });
    expect(world.nodes.some((n) => n.type === "venue_entrance")).toBe(true);
    expect(world.nodes.some((n) => n.canonicalId?.includes("place-harbour"))).toBe(true);
    expect(world.version).toBe(1);
  });

  it("versioning preserves prior worlds", () => {
    setWave6ReleaseGatePassed(true);
    const m = mission();
    buildJourneyWorld({ missionId: m.id, userId: m.participantId });
    propagateDependencyChange({
      missionId: m.id,
      changeType: "lift_outage",
      sourceObservationIds: [],
    });
    expect(listWorldVersions(m.id).length).toBe(2);
    expect(getLatestWorld(m.id)?.version).toBe(2);
  });

  it("propagation performs no external action", () => {
    setWave6ReleaseGatePassed(true);
    const m = mission();
    buildJourneyWorld({ missionId: m.id, userId: m.participantId });
    const result = propagateDependencyChange({
      missionId: m.id,
      changeType: "lift_outage",
      sourceObservationIds: [],
    });
    expect(result.externalActionTaken).toBe(false);
    expect(result.newBlockers.length).toBeGreaterThan(0);
  });
});
