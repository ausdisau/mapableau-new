import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearMissionPlanStore, planMission } from "@/lib/ai/platform/missions";
import {
  analyseDependencyImpact,
  clearRecoveryStore,
  createMissionEvent,
  mapNodeStatusToDependencyState,
  traverseDependencies,
} from "@/lib/ai/platform/recovery";

describe("Recovery impact", () => {
  beforeEach(() => {
    clearMissionPlanStore();
    clearRecoveryStore();
    process.env.MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED = "true";
    process.env.MAPABLE_ADAPTIVE_RECOVERY_ENABLED = "true";
  });
  afterEach(() => {
    delete process.env.MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED;
    delete process.env.MAPABLE_ADAPTIVE_RECOVERY_ENABLED;
    clearMissionPlanStore();
    clearRecoveryStore();
  });

  it("never merges not_authorised into missing", () => {
    expect(mapNodeStatusToDependencyState("not_authorised")).toBe("not_authorised");
    expect(mapNodeStatusToDependencyState("consent_required")).toBe("consent_required");
    expect(mapNodeStatusToDependencyState("disabled")).toBe("disabled");
    expect(mapNodeStatusToDependencyState("missing")).toBe("missing");
  });

  it("marks transport failed and preserves unrelated domain (scenario K)", () => {
    const plan = planMission({
      actorId: "p1", participantId: "p1",
      objective: "Job interview tomorrow — wheelchair accessible transport and support getting ready",
      requestedUseOfAccessibilityProfile: false, plainLanguage: true, consentScopes: [], source: "participant_text",
    });
    const event = createMissionEvent({
      missionId: plan.missionId, type: "TRANSPORT_UNAVAILABLE", source: "authenticated_internal",
      systemRecordId: "trip-fail", affectedNodeIds: ["node-transport"],
    });
    const impacts = analyseDependencyImpact({ graph: plan.missionGraph, events: [event] });
    expect(impacts.find((i) => i.nodeId === "node-transport")?.currentState).toBe("failed");
    const care = impacts.find((i) => i.nodeId === "node-care-support");
    if (care) {
      expect(care.preserved).toBe(true);
      expect(care.currentState).not.toBe("failed");
    }
    expect(impacts.find((i) => i.nodeId === "node-goal")?.preserved).toBe(true);
  });

  it("traverses requires dependencies from interview to transport", () => {
    const plan = planMission({
      actorId: "p1", participantId: "p1", objective: "Interview with wheelchair transport",
      requestedUseOfAccessibilityProfile: false, plainLanguage: true, consentScopes: [], source: "participant_text",
    });
    const related = traverseDependencies(plan.missionGraph, ["node-job-interview"]);
    expect(related).toContain("node-job-interview");
    expect(related).toContain("node-transport");
  });
});
