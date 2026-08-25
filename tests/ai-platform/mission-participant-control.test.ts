import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  clearMissionPlanStore,
  planMission,
  replanMission,
} from "@/lib/ai/platform/missions";

describe("Mission participant control", () => {
  beforeEach(() => {
    clearMissionPlanStore();
    process.env.MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED = "true";
  });

  afterEach(() => {
    delete process.env.MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED;
    clearMissionPlanStore();
  });

  it("continues without profile when participant declines profile use", () => {
    const plan = planMission({
      actorId: "p1",
      participantId: "p1",
      objective: "Interview tomorrow — need transport",
      requestedUseOfAccessibilityProfile: false,
      profileConsentGranted: false,
      plainLanguage: true,
      consentScopes: [],
      source: "participant_text",
    });
    expect(plan.missionGraph.nodes.every((n) => n.status !== "consent_required")).toBe(
      true,
    );
    expect(plan.uncertainties.length).toBeGreaterThan(0);
  });

  it("allows participant to reject a recommendation via replan", () => {
    const plan = planMission({
      actorId: "p1",
      participantId: "p1",
      objective:
        "Job interview tomorrow — wheelchair accessible transport and support getting ready",
      requestedUseOfAccessibilityProfile: false,
      plainLanguage: true,
      consentScopes: [],
      source: "participant_text",
    });
    const target = plan.recommendations[0]?.id;
    expect(target).toBeTruthy();
    const updated = replanMission({
      missionId: plan.missionId,
      actorId: "p1",
      participantId: "p1",
      rejectedRecommendationIds: target ? [target] : [],
    });
    expect(updated.recommendations.find((r) => r.id === target)).toBeUndefined();
  });

  it("exposes non-AI path on every plan", () => {
    const plan = planMission({
      actorId: "p1",
      participantId: "p1",
      objective: "Simple goal",
      requestedUseOfAccessibilityProfile: false,
      plainLanguage: true,
      consentScopes: [],
      source: "participant_text",
    });
    expect(plan.nonAiPath.href).toBeTruthy();
    expect(plan.nonAiPath.label).toMatch(/without AI/i);
  });

  it("does not include worker assignment in action proposals", () => {
    const plan = planMission({
      actorId: "p1",
      participantId: "p1",
      objective: "Need support worker for interview prep and transport",
      requestedUseOfAccessibilityProfile: false,
      plainLanguage: true,
      consentScopes: [],
      source: "participant_text",
    });
    const payloads = JSON.stringify(plan.actionProposals);
    expect(payloads).not.toMatch(/assign_worker|book_service|approve_payment/);
  });
});
