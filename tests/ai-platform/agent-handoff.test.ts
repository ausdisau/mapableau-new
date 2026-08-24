import { describe, expect, it } from "vitest";

import {
  assertHandoffDoesNotRaiseAuthority,
  assertHandoffPreservesHumanOnly,
  compareAuthorityCeiling,
  createMapAbleAgentHandoff,
  createMapAbleMissionContext,
  effectiveHandoffAuthority,
  projectMissionContextForAgent,
} from "@/lib/ai/platform/agents";

describe("MapAble agent handoff", () => {
  const mission = createMapAbleMissionContext({
    missionId: "mission-1",
    actor: { actorId: "p1", actorType: "participant" },
    participantId: "participant-1",
    objective: "Attend appointment with support",
    domains: ["core", "care", "transport"],
    consentScopes: ["care_coordination"],
    evidenceRefs: ["ev-1"],
    activeAgentIds: [
      "mission_orchestrator",
      "participant_authority",
      "support_participation",
    ],
    authorityCeiling: "READ_ONLY_EXPLAIN",
    traceId: "trace-1",
  });

  it("cannot increase authority during handoff", () => {
    const handoff = createMapAbleAgentHandoff({
      mission,
      fromAgent: "mission_orchestrator",
      toAgent: "support_participation",
      capabilityKey: "matching.care_rules",
    });

    expect(
      compareAuthorityCeiling(
        handoff.authorityCeiling,
        mission.authorityCeiling
      )
    ).toBeLessThanOrEqual(0);

    const check = assertHandoffDoesNotRaiseAuthority(handoff);
    expect(check.ok).toBe(true);
  });

  it("effectiveAuthority is min of mission, source, target, capability", () => {
    const effective = effectiveHandoffAuthority({
      missionAuthority: "DRAFT_ONLY",
      sourceAgentId: "mission_orchestrator",
      targetAgentId: "support_participation",
      capabilityKey: "matching.care_rules",
    });
    // orchestrator is READ_ONLY_EXPLAIN → pulls effective down
    expect(effective).toBe("READ_ONLY_EXPLAIN");
  });

  it("blocks handoff of human-only safeguarding workflows to agents", () => {
    const blocked = assertHandoffPreservesHumanOnly({
      category: "safeguarding",
      targetAgentId: "continuity_assurance",
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.reason).toMatch(/human_only/);
    }
  });

  it("projects minimum necessary mission context to a specialist", () => {
    const projected = projectMissionContextForAgent(
      mission,
      "support_participation"
    );
    expect(projected).toMatchObject({
      missionId: "mission-1",
      agentId: "support_participation",
      objective: mission.objective,
      evidenceRefs: ["ev-1"],
    });
    expect(projected).not.toHaveProperty("approvalBindings");
    expect(projected).not.toHaveProperty("featureFlags");
  });

  it("keeps missing evidence distinct from unauthorised in handoff context", () => {
    const handoff = createMapAbleAgentHandoff({
      mission,
      fromAgent: "evidence_intelligence",
      toAgent: "mission_orchestrator",
      minimumContext: {
        evidenceStatus: "missing",
        accessAuthorised: false,
      },
      unresolvedQuestions: ["Is access evidence authorised for this venue?"],
    });
    expect(handoff.minimumContext.evidenceStatus).toBe("missing");
    expect(handoff.minimumContext.accessAuthorised).toBe(false);
    expect(handoff.unresolvedQuestions.length).toBeGreaterThan(0);
  });
});
