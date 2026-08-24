import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearMissionPlanStore, planMission } from "@/lib/ai/platform/missions";
import {
  clearRecoveryStore, ensureMissionRecoveryTracking, formatRecoveryForParticipant,
  getActivityLog, getRecoveryState, ingestMissionEvent, reassessMission, selectRecoveryAlternative,
} from "@/lib/ai/platform/recovery";

describe("Recovery participant control", () => {
  beforeEach(() => {
    clearMissionPlanStore(); clearRecoveryStore();
    process.env.MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED = "true";
    process.env.MAPABLE_ADAPTIVE_RECOVERY_ENABLED = "true";
  });
  afterEach(() => {
    delete process.env.MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED;
    delete process.env.MAPABLE_ADAPTIVE_RECOVERY_ENABLED;
    delete process.env.MAPABLE_RECOVERY_KILL_SWITCH;
    clearMissionPlanStore(); clearRecoveryStore();
  });

  it("rejecting all options leaves decisions with participant (scenario F)", () => {
    const plan = planMission({
      actorId: "p1", participantId: "p1", objective: "Interview with transport",
      requestedUseOfAccessibilityProfile: false, plainLanguage: true, consentScopes: [], source: "participant_text",
    });
    ensureMissionRecoveryTracking(plan);
    ingestMissionEvent({
      missionId: plan.missionId, type: "TRANSPORT_UNAVAILABLE", source: "authenticated_internal",
      systemRecordId: "t1", affectedNodeIds: ["node-transport"],
    });
    const state = reassessMission({ missionId: plan.missionId });
    expect(state.status).toBe("awaiting_participant");
    expect(state.activePlanVersion).toBe(1);
    expect(getRecoveryState(plan.missionId)?.alternatives.length).toBeGreaterThan(0);
  });

  it("presentation never auto-advances decisions", () => {
    const plan = planMission({
      actorId: "p1", participantId: "p1", objective: "Interview with transport",
      requestedUseOfAccessibilityProfile: false, plainLanguage: true, consentScopes: [], source: "participant_text",
    });
    ensureMissionRecoveryTracking(plan);
    ingestMissionEvent({
      missionId: plan.missionId, type: "TRANSPORT_UNAVAILABLE", source: "authenticated_internal",
      systemRecordId: "t2", affectedNodeIds: ["node-transport"],
    });
    const state = reassessMission({ missionId: plan.missionId });
    const presentation = formatRecoveryForParticipant({ state, activity: getActivityLog(plan.missionId) });
    const titles = presentation.sections.map((s) => s.title);
    expect(titles).toEqual(expect.arrayContaining([
      "What changed", "Your current plan", "Parts at risk", "Options",
      "What needs your decision", "Previous plan", "Activity",
    ]));
  });

  it("kill switch blocks auto reassessment but keeps viewing (scenario I)", () => {
    const plan = planMission({
      actorId: "p1", participantId: "p1", objective: "Interview with transport",
      requestedUseOfAccessibilityProfile: false, plainLanguage: true, consentScopes: [], source: "participant_text",
    });
    ensureMissionRecoveryTracking(plan);
    ingestMissionEvent({
      missionId: plan.missionId, type: "TRANSPORT_UNAVAILABLE", source: "authenticated_internal",
      systemRecordId: "t3", affectedNodeIds: ["node-transport"],
    });
    process.env.MAPABLE_RECOVERY_KILL_SWITCH = "true";
    expect(() => reassessMission({ missionId: plan.missionId })).toThrow(/KILL_SWITCH/);
    expect(getRecoveryState(plan.missionId)?.killSwitchActive).toBe(true);
  });

  it("selecting own-transport option updates candidate without booking", () => {
    const plan = planMission({
      actorId: "p1", participantId: "p1", objective: "Interview with transport",
      requestedUseOfAccessibilityProfile: false, plainLanguage: true, consentScopes: [], source: "participant_text",
    });
    ensureMissionRecoveryTracking(plan);
    ingestMissionEvent({
      missionId: plan.missionId, type: "TRANSPORT_UNAVAILABLE", source: "authenticated_internal",
      systemRecordId: "t4", affectedNodeIds: ["node-transport"],
    });
    const state = reassessMission({ missionId: plan.missionId });
    const own = state.alternatives.find((a) => a.label.toLowerCase().includes("own transport"));
    expect(own).toBeTruthy();
    const result = selectRecoveryAlternative({
      missionId: plan.missionId, alternativeId: own!.alternativeId, actorId: "p1", participantId: "p1",
    });
    expect(result.candidatePlan.missionGraph.nodes.find((n) => n.id === "node-transport")?.status).toBe("confirmed");
    expect(JSON.stringify(result.candidatePlan)).not.toMatch(/book_transport/);
  });
});
