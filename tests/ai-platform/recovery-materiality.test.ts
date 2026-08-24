import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearMissionPlanStore, planMission } from "@/lib/ai/platform/missions";
import {
  analyseDependencyImpact, clearRecoveryStore, createMissionEvent,
  evaluateApprovalPreservation, evaluateMaterialityGate, evaluateReassessmentTrigger,
} from "@/lib/ai/platform/recovery";

describe("Recovery materiality", () => {
  beforeEach(() => {
    clearMissionPlanStore(); clearRecoveryStore();
    process.env.MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED = "true";
    process.env.MAPABLE_ADAPTIVE_RECOVERY_ENABLED = "true";
  });
  afterEach(() => {
    delete process.env.MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED;
    delete process.env.MAPABLE_ADAPTIVE_RECOVERY_ENABLED;
    clearMissionPlanStore(); clearRecoveryStore();
  });

  it("price change requires reapproval (scenario D)", () => {
    const plan = planMission({
      actorId: "p1", participantId: "p1", objective: "Interview with transport",
      requestedUseOfAccessibilityProfile: false, plainLanguage: true, consentScopes: [], source: "participant_text",
    });
    const event = createMissionEvent({
      missionId: plan.missionId, type: "PRICE_CHANGED", source: "verified_external",
      systemRecordId: "quote-9", affectedNodeIds: ["node-transport"],
      payload: { previousPrice: 40, newPrice: 75 },
    });
    const trigger = evaluateReassessmentTrigger([event]);
    const impacts = analyseDependencyImpact({ graph: plan.missionGraph, events: [event] });
    const gate = evaluateMaterialityGate({ trigger, impacts, events: [event] });
    expect(gate).toBe("REAPPROVAL_REQUIRED");
    const approvals = evaluateApprovalPreservation({
      bindings: [{
        proposalHash: "abc", actorId: "p1", actorAuthority: "participant", purpose: "transport draft",
        timestamp: new Date().toISOString(), expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        dataDisclosed: [], proposedAction: "prepare_transport_request", revision: 1,
      }],
      events: [event], materialityGate: gate,
    });
    expect(approvals[0]?.preservation).toBe("INVALIDATED_BY_PRICE_CHANGE");
  });

  it("safeguarding requires human review (scenario H)", () => {
    const event = createMissionEvent({
      missionId: "m1", type: "SAFEGUARDING_SIGNAL", source: "authenticated_internal",
      systemRecordId: "sg-1", affectedNodeIds: ["node-goal"],
    });
    const trigger = evaluateReassessmentTrigger([event]);
    expect(evaluateMaterialityGate({ trigger, impacts: [], events: [event] })).toBe("HUMAN_REVIEW_REQUIRED");
  });

  it("consent revoke requires participant decision (scenario E)", () => {
    const event = createMissionEvent({
      missionId: "m1", type: "CONSENT_REVOKED", source: "participant_reported",
      reportedBy: "p1", affectedNodeIds: ["node-profile"],
    });
    const trigger = evaluateReassessmentTrigger([event]);
    expect(evaluateMaterialityGate({ trigger, impacts: [], events: [event] })).toBe("PARTICIPANT_DECISION_REQUIRED");
  });

  it("impossible deadline is BLOCKED (scenario L)", () => {
    const event = createMissionEvent({
      missionId: "m1", type: "DEADLINE_APPROACHING", source: "system_derived",
      affectedNodeIds: ["node-job-interview"],
      payload: { impossible: true, deadlineIso: new Date().toISOString() },
    });
    const trigger = evaluateReassessmentTrigger([event]);
    expect(evaluateMaterialityGate({ trigger, impacts: [], events: [event] })).toBe("BLOCKED");
  });
});
