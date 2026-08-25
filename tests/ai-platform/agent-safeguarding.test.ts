import { describe, expect, it } from "vitest";

import {
  assertHandoffPreservesHumanOnly,
  requireMapAbleAgent,
  selectMapAbleAgents,
} from "@/lib/ai/platform/agents";
import {
  evaluateSafeguardingGate,
  safeguardingGateMayDecideReportability,
  safeguardingGateMaySubstantiateAllegation,
} from "@/lib/ai/platform/policies/safeguarding-gate";

describe("MapAble safeguarding gate", () => {
  it("creates a human review item and halts AI execution", () => {
    const result = evaluateSafeguardingGate({
      objective: "I need to raise a safeguarding allegation about neglect",
      evidenceRefs: ["note-1"],
      traceId: "sg-1",
    });

    expect(result.halted).toBe(true);
    if (!result.halted) return;
    expect(result.humanReviewItem.category).toBe("safeguarding");
    expect(result.humanReviewItem.evidenceRefs).toContain("note-1");
    expect(result.continuationMessage).toMatch(/human safeguarding review/i);
    expect(result.aiMayDecideReportability).toBe(false);
    expect(result.aiMaySubstantiateAllegation).toBe(false);
  });

  it("cannot decide reportability or substantiate allegations", () => {
    expect(safeguardingGateMayDecideReportability()).toBe(false);
    expect(safeguardingGateMaySubstantiateAllegation()).toBe(false);

    const continuity = requireMapAbleAgent("continuity_assurance");
    expect(continuity.prohibitedActions).toEqual(
      expect.arrayContaining([
        "determine_incident_reportability",
        "substantiate_or_dismiss_allegation",
        "close_incident_or_complaint",
        "approve_restrictive_practice",
      ])
    );
  });

  it("does not treat ordinary missions as safeguarding", () => {
    const result = evaluateSafeguardingGate({
      objective: "Help me get to a job interview tomorrow and arrange support",
    });
    expect(result.halted).toBe(false);
  });

  it("surfaces human review via activation when safeguarding cues are present", () => {
    const activation = selectMapAbleAgents({
      objective: "Report a safeguarding concern about abuse",
      domains: ["core", "care"],
      actor: { actorId: "p1", actorType: "participant" },
      enabledModules: { core: true, care: true },
      relaxCapabilityFlags: true,
    });

    expect(activation.requiredHumanReviews.length).toBeGreaterThan(0);
    expect(activation.requiredHumanReviews[0]?.category).toBe("safeguarding");
    expect(
      activation.activeAgents.find((a) => a.id === "participant_authority")
    ).toBeTruthy();
  });

  it("refuses to hand safeguarding workflows to operational agents", () => {
    const result = assertHandoffPreservesHumanOnly({
      category: "safeguarding",
      targetAgentId: "mission_orchestrator",
    });
    expect(result.ok).toBe(false);
  });
});
