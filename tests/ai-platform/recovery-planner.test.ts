import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearMissionPlanStore, planMission } from "@/lib/ai/platform/missions";
import {
  clearRecoveryStore, ensureMissionRecoveryTracking, getRecoveryState,
  ingestMissionEvent, reassessMission, selectRecoveryAlternative,
} from "@/lib/ai/platform/recovery";

describe("Recovery planner", () => {
  beforeEach(() => {
    clearMissionPlanStore(); clearRecoveryStore();
    process.env.MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED = "true";
    process.env.MAPABLE_ADAPTIVE_RECOVERY_ENABLED = "true";
  });
  afterEach(() => {
    delete process.env.MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED;
    delete process.env.MAPABLE_ADAPTIVE_RECOVERY_ENABLED;
    delete process.env.MAPABLE_PROACTIVE_REASSESSMENT_ENABLED;
    delete process.env.MAPABLE_RECOVERY_KILL_SWITCH;
    clearMissionPlanStore(); clearRecoveryStore();
  });

  it("reassesses interview+transport unavailable (scenario A)", () => {
    const plan = planMission({
      actorId: "p1", participantId: "p1",
      objective: "Job interview tomorrow — wheelchair accessible transport",
      requestedUseOfAccessibilityProfile: false, plainLanguage: true, consentScopes: [], source: "participant_text",
    });
    ensureMissionRecoveryTracking(plan);
    ingestMissionEvent({
      missionId: plan.missionId, type: "TRANSPORT_UNAVAILABLE", source: "authenticated_internal",
      systemRecordId: "trip-1", affectedNodeIds: ["node-transport"],
    });
    const state = reassessMission({ missionId: plan.missionId });
    expect(state.trigger?.shouldReassess).toBe(true);
    expect(state.trigger?.reasonCodes).toContain("TRANSPORT_DISRUPTION");
    expect(state.alternatives.length).toBeGreaterThan(0);
    expect(state.alternatives.some((a) => a.label.includes("transport"))).toBe(true);
    expect(state.whatChanged.length).toBeGreaterThan(0);
  });

  it("handles worker cancel with care alternatives (scenario B)", () => {
    const plan = planMission({
      actorId: "p1", participantId: "p1", objective: "Interview — need support getting ready",
      requestedUseOfAccessibilityProfile: false, plainLanguage: true, consentScopes: [], source: "participant_text",
    });
    ensureMissionRecoveryTracking(plan);
    ingestMissionEvent({
      missionId: plan.missionId, type: "WORKER_CANCELLED", source: "authenticated_internal",
      systemRecordId: "worker-1", affectedNodeIds: ["node-care-support"],
    });
    const state = reassessMission({ missionId: plan.missionId });
    expect(state.trigger?.reasonCodes).toContain("WORKER_UNAVAILABLE");
    expect(state.alternatives.some((a) => a.label.toLowerCase().includes("support"))).toBe(true);
  });

  it("venue access change produces review option (scenario C)", () => {
    const plan = planMission({
      actorId: "p1", participantId: "p1", objective: "Job interview at workplace",
      requestedUseOfAccessibilityProfile: false, plainLanguage: true, consentScopes: [], source: "participant_text",
    });
    ensureMissionRecoveryTracking(plan);
    ingestMissionEvent({
      missionId: plan.missionId, type: "VENUE_ACCESS_CHANGED", source: "verified_external",
      systemRecordId: "venue-1", affectedNodeIds: ["node-workplace-access"],
    });
    const state = reassessMission({ missionId: plan.missionId });
    expect(state.trigger?.reasonCodes).toContain("ACCESS_EVIDENCE_CHANGED");
    expect(state.alternatives.some((a) => a.label.toLowerCase().includes("access"))).toBe(true);
  });

  it("versions plans without silent overwrite", () => {
    const plan = planMission({
      actorId: "p1", participantId: "p1", objective: "Interview with transport",
      requestedUseOfAccessibilityProfile: false, plainLanguage: true, consentScopes: [], source: "participant_text",
    });
    ensureMissionRecoveryTracking(plan);
    expect(plan.planVersion).toBe(1);
    ingestMissionEvent({
      missionId: plan.missionId, type: "TRANSPORT_UNAVAILABLE", source: "authenticated_internal",
      systemRecordId: "t2", affectedNodeIds: ["node-transport"],
    });
    const state = reassessMission({ missionId: plan.missionId });
    expect(state.candidatePlanVersion).toBeGreaterThan(1);
    expect(state.activePlanVersion).toBe(1);
    expect(state.previousPlanVersions).toContain(1);
  });

  it("selecting alternative updates candidate plan without executing", () => {
    const plan = planMission({
      actorId: "p1", participantId: "p1", objective: "Interview with transport",
      requestedUseOfAccessibilityProfile: false, plainLanguage: true, consentScopes: [], source: "participant_text",
    });
    ensureMissionRecoveryTracking(plan);
    ingestMissionEvent({
      missionId: plan.missionId, type: "TRANSPORT_UNAVAILABLE", source: "authenticated_internal",
      systemRecordId: "t3", affectedNodeIds: ["node-transport"],
    });
    const state = reassessMission({ missionId: plan.missionId });
    const alt = state.alternatives[0];
    expect(alt).toBeTruthy();
    const selected = selectRecoveryAlternative({
      missionId: plan.missionId, alternativeId: alt!.alternativeId, actorId: "p1", participantId: "p1",
    });
    expect(selected.candidatePlan.missionId).toBe(plan.missionId);
    expect(JSON.stringify(selected.candidatePlan.actionProposals)).not.toMatch(/assign_worker|book_service|approve_payment/);
  });

  it("action failed triggers recovery (scenario G)", () => {
    const plan = planMission({
      actorId: "p1", participantId: "p1", objective: "Interview with transport",
      requestedUseOfAccessibilityProfile: false, plainLanguage: true, consentScopes: [], source: "participant_text",
    });
    ensureMissionRecoveryTracking(plan);
    ingestMissionEvent({
      missionId: plan.missionId, type: "ACTION_FAILED", source: "authenticated_internal",
      systemRecordId: "action-1", affectedNodeIds: ["node-transport"],
      payload: { action: "prepare_transport_request" },
    });
    const state = reassessMission({ missionId: plan.missionId });
    expect(state.trigger?.reasonCodes).toContain("ACTION_EXECUTION_FAILED");
    expect(getRecoveryState(plan.missionId)?.status).not.toBe("stable");
  });
});
