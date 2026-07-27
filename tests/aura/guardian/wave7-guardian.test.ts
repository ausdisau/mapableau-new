import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  enableGuardian,
  listAlerts,
  processLiftOutage,
  resetGuardianStore,
  stopGuardian,
} from "@/lib/aura/guardian";
import { registerCalibrationMission, resetMissionStore } from "@/lib/aura/mission/store";
import { listProposalsForMission, resetProposalStore } from "@/lib/aura/proposals";
import { resetSensorStore } from "@/lib/aura/sensorthings";
import { resetStopRegistry } from "@/lib/aura/stop";
import { resetWitnessStore } from "@/lib/aura/witness";
import {
  buildJourneyWorld,
  resetWorldModelStore,
} from "@/lib/aura/world-model";

function resetAll() {
  resetMissionStore();
  resetWitnessStore();
  resetWorldModelStore();
  resetSensorStore();
  resetGuardianStore();
  resetProposalStore();
  resetStopRegistry();
}

describe("Wave 7 — Journey Guardian", () => {
  beforeEach(() => {
    process.env.MAPABLE_AURA_ENABLED = "true";
    process.env.MAPABLE_AURA_WORLD_MODEL_ENABLED = "true";
    process.env.MAPABLE_AURA_JOURNEY_GUARDIAN_ENABLED = "true";
    process.env.MAPABLE_AURA_SENSORTHINGS_ENABLED = "true";
    resetAll();
  });

  afterEach(() => {
    resetAll();
    delete process.env.MAPABLE_AURA_ENABLED;
    delete process.env.MAPABLE_AURA_WORLD_MODEL_ENABLED;
    delete process.env.MAPABLE_AURA_JOURNEY_GUARDIAN_ENABLED;
    delete process.env.MAPABLE_AURA_SENSORTHINGS_ENABLED;
  });

  it("processLiftOutage creates alert and venue_verification_request", () => {
    const m = registerCalibrationMission({
      participantId: "demo-participant-taylor",
      placeId: "place-harbour-civic",
    });
    buildJourneyWorld({ missionId: m.id, userId: m.participantId });
    enableGuardian({ missionId: m.id, userId: m.participantId });

    const alert = processLiftOutage({
      missionId: m.id,
      userId: m.participantId,
      placeId: m.placeId,
      elementId: "hcc-lift-west",
    });

    expect(alert.severity).toBe("urgent");
    expect(alert.effects.routeChanged).toBe(true);
    expect(alert.venueVerificationRequestId).toBeTruthy();
    expect(listAlerts(m.id)).toHaveLength(1);
    const proposals = listProposalsForMission(m.id);
    expect(proposals).toHaveLength(1);
    expect(proposals[0]!.actionType).toBe("venue_verification_request");
    expect(proposals[0]!.recipientLabel).toMatch(/reception/i);
  });

  it("rejects forged outage from non-owner (mission ownership)", () => {
    const m = registerCalibrationMission({
      participantId: "owner",
      placeId: "place-harbour-civic",
    });
    buildJourneyWorld({ missionId: m.id, userId: "owner" });
    enableGuardian({ missionId: m.id, userId: "owner" });

    expect(() =>
      processLiftOutage({
        missionId: m.id,
        userId: "attacker",
        placeId: m.placeId,
        elementId: "hcc-lift-west",
      }),
    ).toThrow(/AURA_MISSION_FORBIDDEN/);
  });

  it("requires pre-existing journey world (AURA_WORLD_NOT_FOUND)", () => {
    const m = registerCalibrationMission({
      participantId: "p1",
      placeId: "place-harbour-civic",
    });
    enableGuardian({ missionId: m.id, userId: "p1" });

    expect(() =>
      processLiftOutage({
        missionId: m.id,
        userId: "p1",
        placeId: m.placeId,
        elementId: "hcc-lift-west",
      }),
    ).toThrow(/AURA_WORLD_NOT_FOUND/);
  });

  it("participant can enable and stop monitoring", () => {
    const m = registerCalibrationMission({ participantId: "p1" });
    const g = enableGuardian({ missionId: m.id, userId: "p1" });
    expect(g.state).toBe("monitoring");
    const stopped = stopGuardian({ missionId: m.id, userId: "p1" });
    expect(stopped.state).toBe("stopped");
  });
});
