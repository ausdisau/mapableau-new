import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { clearMissionPlanStore, planMission } from "@/lib/ai/platform/missions";

const INTERVIEW_OBJECTIVE =
  "I have a job interview tomorrow at 10am. I need help getting ready and I need wheelchair-accessible transport.";

describe("Mission Runtime — end-to-end planning", () => {
  beforeEach(() => {
    clearMissionPlanStore();
    process.env.MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED = "true";
    delete process.env.MAPABLE_AI_GLOBAL_KILL_SWITCH;
  });

  afterEach(() => {
    delete process.env.MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED;
    clearMissionPlanStore();
  });

  it("plans cross-domain interview mission with canonical agents", () => {
    const plan = planMission({
      actorId: "participant-1",
      participantId: "participant-1",
      objective: INTERVIEW_OBJECTIVE,
      requestedUseOfAccessibilityProfile: false,
      plainLanguage: true,
      consentScopes: [],
      source: "participant_text",
    });

    expect(plan.domains).toEqual(
      expect.arrayContaining(["core", "jobs", "transport", "access", "care"]),
    );
    expect(plan.activeAgentIds).toContain("mission_orchestrator");
    expect(plan.activeAgentIds).toContain("participant_authority");
    expect(plan.actionProposals.some((p) => p.action === "prepare_transport_request")).toBe(
      true,
    );
    expect(
      plan.actionProposals.every((p) => p.requiredApprovals.includes("participant")),
    ).toBe(true);
    expect(plan.status).not.toBe("ready");
  });

  it("fails closed when nerve centre flag is off", () => {
    delete process.env.MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED;
    expect(() =>
      planMission({
        actorId: "p1",
        participantId: "p1",
        objective: "Need transport",
        requestedUseOfAccessibilityProfile: false,
        plainLanguage: true,
        consentScopes: [],
        source: "participant_text",
      }),
    ).toThrow(/AGENTIC_NERVE_CENTRE_DISABLED/);
  });

  it("routes safeguarding to human review without AI conclusion", () => {
    const plan = planMission({
      actorId: "p1",
      participantId: "p1",
      objective: "I need help with a safeguarding allegation at work",
      requestedUseOfAccessibilityProfile: false,
      plainLanguage: true,
      consentScopes: [],
      source: "participant_text",
    });
    expect(plan.status).toBe("human_review_required");
    expect(plan.humanReviewItems.length).toBeGreaterThan(0);
    expect(plan.humanReviewItems[0]?.aiMayDecideReportability).toBe(false);
  });

  it("still produces deterministic plan under global kill switch", () => {
    process.env.MAPABLE_AI_GLOBAL_KILL_SWITCH = "true";
    const plan = planMission({
      actorId: "p1",
      participantId: "p1",
      objective: "I need accessible transport to my appointment.",
      requestedUseOfAccessibilityProfile: false,
      plainLanguage: true,
      consentScopes: [],
      source: "participant_text",
    });
    expect(plan.missionId).toBeTruthy();
    expect(plan.recommendations.length).toBeGreaterThan(0);
  });
});
