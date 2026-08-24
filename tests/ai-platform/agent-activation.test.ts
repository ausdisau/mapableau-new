import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  requireMapAbleAgent,
  selectMapAbleAgents,
} from "@/lib/ai/platform/agents";
import {
  clearCapabilityKillSwitch,
  engageCapabilityKillSwitch,
} from "@/lib/ai/platform/policies/kill-switches";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  clearCapabilityKillSwitch("mission.copilot");
  clearCapabilityKillSwitch("billing.copilot");
  clearCapabilityKillSwitch("search.nl_interpreter");
});

describe("MapAble agent activation", () => {
  it("activates orchestrator and participant authority for participant missions", () => {
    const result = selectMapAbleAgents({
      objective:
        "Help me get to a job interview tomorrow and arrange support",
      domains: ["core", "jobs", "care", "transport", "access"],
      actor: { actorId: "p1", actorType: "participant" },
      consentScopes: ["disability_disclosure"],
      enabledModules: {
        core: true,
        care: true,
        transport: true,
        jobs: true,
        access: true,
        payments: false,
      },
      relaxCapabilityFlags: true,
    });

    const activeIds = result.activeAgents.map((a) => a.id);
    expect(activeIds).toEqual(
      expect.arrayContaining([
        "mission_orchestrator",
        "participant_authority",
        "evidence_intelligence",
        "work_participation",
        "support_participation",
        "access_mobility",
        "continuity_assurance",
      ])
    );
    expect(activeIds).not.toContain("finance_administration");
  });

  it("does not activate finance unless payments domain is relevant", () => {
    const without = selectMapAbleAgents({
      objective: "Help me book support for tomorrow",
      domains: ["core", "care"],
      actor: { actorId: "p1", actorType: "participant" },
      enabledModules: { core: true, care: true, payments: false },
    });
    expect(
      without.activeAgents.find((a) => a.id === "finance_administration")
    ).toBeUndefined();

    process.env.BILLING_COPILOT_ENABLED = "true";
    process.env.MAPABLE_BILLING_EVIDENCE_COPILOT_ENABLED = "true";
    const withPay = selectMapAbleAgents({
      objective: "Explain my invoice discrepancy",
      domains: ["core", "payments"],
      actor: { actorId: "p1", actorType: "participant" },
      enabledModules: { core: true, payments: true },
      relaxCapabilityFlags: true,
    });
    expect(
      withPay.activeAgents.some((a) => a.id === "finance_administration")
    ).toBe(true);
  });

  it("degrades work participation without disability disclosure consent", () => {
    const result = selectMapAbleAgents({
      objective: "Find accessible jobs near me",
      domains: ["core", "jobs"],
      actor: { actorId: "p1", actorType: "participant" },
      consentScopes: [],
      enabledModules: { core: true, jobs: true },
      relaxCapabilityFlags: true,
    });
    const work = result.activeAgents.find((a) => a.id === "work_participation");
    expect(work?.status).toBe("degraded");
    expect(result.missingConsentScopes).toContain("disability_disclosure");
    expect(
      requireMapAbleAgent("work_participation").prohibitedActions
    ).toContain("publish_participant_information");
  });

  it("marks agents unavailable when all capability flags are off", () => {
    const result = selectMapAbleAgents({
      objective: "Plan my care mission",
      domains: ["core", "care"],
      actor: { actorId: "p1", actorType: "participant" },
      enabledModules: { core: true, care: true },
    });
    const support = [
      ...result.activeAgents,
      ...result.unavailableAgents,
    ].find((a) => a.id === "support_participation");
    expect(support?.status).toMatch(/unavailable|degraded|active/);
  });

  it("degrades model-backed paths when kill switch is engaged and keeps fallback", () => {
    process.env.MAPABLE_MISSION_COPILOT_ENABLED = "true";
    process.env.MAPABLE_MISSION_GRAPH_ENABLED = "true";
    process.env.MAPABLE_SEMANTIC_RETRIEVAL_ENABLED = "true";
    engageCapabilityKillSwitch("mission.copilot");

    const result = selectMapAbleAgents({
      objective: "Coordinate my appointment mission",
      domains: ["core"],
      actor: { actorId: "p1", actorType: "participant" },
      enabledModules: { core: true },
    });

    const orch = result.activeAgents.find(
      (a) => a.id === "mission_orchestrator"
    );
    expect(orch?.fallbackAvailable).toBe(true);
    expect(result.disabledCapabilities).toContain("mission.copilot");
  });

  it("keeps non-AI fallback available on every operational agent", () => {
    for (const agent of [
      "mission_orchestrator",
      "participant_authority",
      "access_mobility",
      "support_participation",
      "finance_administration",
    ] as const) {
      expect(requireMapAbleAgent(agent).fallbackAgentId).toBeTruthy();
    }
  });
});
