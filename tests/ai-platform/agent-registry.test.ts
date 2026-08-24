import { describe, expect, it } from "vitest";

import {
  MAPABLE_OPERATIONAL_AGENT_IDS,
  assertMapAbleAgentRegistryValid,
  getMapAbleAgent,
  listMapAbleAgents,
  requireMapAbleAgent,
  validateMapAbleAgentRegistry,
} from "@/lib/ai/platform/agents";
import { getAiCapability } from "@/lib/ai/platform/capabilities/registry";
import { PROHIBITED_AUTONOMOUS_ACTIONS } from "@/lib/ai/platform/types/authority";

describe("MapAble agent registry", () => {
  it("registers exactly eight canonical operational agent IDs", () => {
    const agents = listMapAbleAgents();
    expect(agents).toHaveLength(8);
    expect(agents.map((a) => a.id).sort()).toEqual(
      [...MAPABLE_OPERATIONAL_AGENT_IDS].sort()
    );
  });

  it("resolves all capability references", () => {
    for (const agent of listMapAbleAgents()) {
      for (const key of agent.capabilityKeys) {
        expect(getAiCapability(key), `${agent.id}:${key}`).toBeDefined();
      }
    }
  });

  it("fails closed on unknown capability lookup via require", () => {
    expect(() => requireMapAbleAgent("not_a_real_agent")).toThrow(
      /MAPABLE_AGENT_NOT_REGISTERED/
    );
    expect(getMapAbleAgent("robotics")).toBeUndefined();
    expect(getMapAbleAgent("safeguarding")).toBeUndefined();
  });

  it("passes fail-closed registry validation", () => {
    const result = validateMapAbleAgentRegistry();
    expect(result.ok).toBe(true);
    expect(() => assertMapAbleAgentRegistryValid()).not.toThrow();
  });

  it("keeps mission orchestrator from operational execute prohibitions", () => {
    const orchestrator = requireMapAbleAgent("mission_orchestrator");
    expect(orchestrator.authorityCeiling).toBe("READ_ONLY_EXPLAIN");
    expect(orchestrator.prohibitedActions).toEqual(
      expect.arrayContaining([
        "assign_support_worker",
        "confirm_transport",
        "approve_or_pay_invoice",
        "approve_ndis_claim",
      ])
    );
  });

  it("keeps robotics and safeguarding out of the operational registry", () => {
    const ids = listMapAbleAgents().map((a) => a.id);
    expect(ids).not.toContain("robotics");
    expect(ids).not.toContain("safeguarding");
  });

  it("requires evaluation suites and fallbacks on every agent", () => {
    for (const agent of listMapAbleAgents()) {
      expect(agent.evaluationSuite.length).toBeGreaterThan(0);
      expect(agent.fallbackAgentId).toBeTruthy();
    }
  });

  it("only lists globally prohibited autonomous actions", () => {
    const global = new Set(PROHIBITED_AUTONOMOUS_ACTIONS);
    for (const agent of listMapAbleAgents()) {
      for (const action of agent.prohibitedActions) {
        expect(global.has(action)).toBe(true);
      }
    }
  });
});
