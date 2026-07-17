import { afterEach, describe, expect, it } from "vitest";

import {
  buildJourneyWorld,
  createAndPlanMission,
  createGuardianProposalDraft,
  enableGuardian,
  invokeWotAction,
  listAlerts,
  processLiftOutage,
  requireMission,
  resetGuardianStore,
  resetLeaseStore,
  resetMissionStore,
  resetProposalStore,
  resetSensorStore,
  resetStopRegistry,
  resetWitnessStore,
  resetWorldModelStore,
  setWave6ReleaseGatePassed,
  stopAuraMission,
  stopGuardian,
} from "@/lib/aura";

function resetAll() {
  resetMissionStore();
  resetLeaseStore();
  resetWitnessStore();
  resetWorldModelStore();
  resetSensorStore();
  resetGuardianStore();
  resetProposalStore();
  resetStopRegistry();
}

afterEach(resetAll);

function taylor() {
  const res = createAndPlanMission({
    goal: "Interview Room 3.12",
    selectedModules: ["access", "transport"],
    placeId: "place-harbour-civic",
    scenarioId: "taylor-harbour-interview",
    userId: "demo-participant-taylor",
  });
  return requireMission(res.missionId);
}

describe("Wave 7 — Journey Guardian", () => {
  it("participant can enable and stop monitoring", () => {
    setWave6ReleaseGatePassed(true);
    const m = taylor();
    const g = enableGuardian({ missionId: m.id, userId: m.participantId });
    expect(g.state).toBe("monitoring");
    const stopped = stopGuardian({ missionId: m.id, userId: m.participantId });
    expect(stopped.state).toBe("stopped");
  });

  it("lift outage creates urgent alert without auto action", () => {
    setWave6ReleaseGatePassed(true);
    const m = taylor();
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
    expect(alert.alternative?.verified).toBe(false);
    expect(listAlerts(m.id).length).toBe(1);
  });

  it("guardian proposal uses existing pipeline with fresh approval", () => {
    setWave6ReleaseGatePassed(true);
    const m = taylor();
    buildJourneyWorld({ missionId: m.id, userId: m.participantId });
    enableGuardian({ missionId: m.id, userId: m.participantId });
    const alert = processLiftOutage({
      missionId: m.id,
      userId: m.participantId,
      placeId: m.placeId,
      elementId: "hcc-lift-west",
    });
    const draft = createGuardianProposalDraft({
      missionId: m.id,
      userId: m.participantId,
      alertId: alert.id,
      actionType: "ask_venue_about_alternative",
    });
    expect(draft.requiresFreshApproval).toBe(true);
    expect(draft.proposalId).toBeTruthy();
  });

  it("stop AURA stops guardian monitoring context", () => {
    setWave6ReleaseGatePassed(true);
    const m = taylor();
    enableGuardian({ missionId: m.id, userId: m.participantId });
    stopAuraMission(m.id, m.participantId);
    expect(() =>
      processLiftOutage({
        missionId: m.id,
        userId: m.participantId,
        placeId: m.placeId,
        elementId: "hcc-lift-west",
      }),
    ).toThrow();
  });

  it("WoT actions cannot be invoked", () => {
    expect(() => invokeWotAction()).toThrow("AURA_WOT_ACTIONS_DISABLED");
  });
});
