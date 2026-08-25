import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearMissionPlanStore, planMission } from "@/lib/ai/platform/missions";
import {
  clearRecoveryStore, createMissionEvent, ingestMissionEvent, validateEventProvenance,
} from "@/lib/ai/platform/recovery";

describe("Recovery events", () => {
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

  it("rejects model inference asserting transport failure", () => {
    const result = validateEventProvenance({
      missionId: "m1", type: "TRANSPORT_UNAVAILABLE", source: "model_inference",
    });
    expect(result.valid).toBe(false);
  });

  it("accepts verified external transport cancellation", () => {
    const event = createMissionEvent({
      missionId: "m1", type: "TRANSPORT_UNAVAILABLE", source: "verified_external",
      systemRecordId: "trip-123", affectedNodeIds: ["node-transport"],
    });
    expect(event.provenance.verificationState).toBe("verified");
  });

  it("idempotent events do not duplicate (scenario J)", () => {
    const plan = planMission({
      actorId: "p1", participantId: "p1",
      objective: "Interview tomorrow — wheelchair accessible transport",
      requestedUseOfAccessibilityProfile: false, plainLanguage: true, consentScopes: [], source: "participant_text",
    });
    const first = ingestMissionEvent({
      missionId: plan.missionId, type: "TRANSPORT_UNAVAILABLE", source: "authenticated_internal",
      systemRecordId: "t1", affectedNodeIds: ["node-transport"], idempotencyKey: "idem-transport-1",
    });
    const second = ingestMissionEvent({
      missionId: plan.missionId, type: "TRANSPORT_UNAVAILABLE", source: "authenticated_internal",
      systemRecordId: "t1", affectedNodeIds: ["node-transport"], idempotencyKey: "idem-transport-1",
    });
    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
  });

  it("participant-reported events require reportedBy", () => {
    expect(() => createMissionEvent({
      missionId: "m1", type: "PARTICIPANT_CHANGED_GOAL", source: "participant_reported",
    })).toThrow(/reportedBy/);
  });
});
