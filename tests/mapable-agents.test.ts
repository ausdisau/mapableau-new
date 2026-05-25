import { describe, expect, it } from "vitest";

import { FORBIDDEN_EXECUTE_TOOLS, HIGH_RISK_TOOL_NAMES } from "@/lib/agents/agent-types";
import { getAgentConfig, listAgentConfigs } from "@/lib/agents/agent-registry";
import { routeOrchestrator, resolveAgentId } from "@/lib/agents/agents/orchestrator-agent";
import { getToolPolicy, TOOL_POLICIES } from "@/lib/agents/tools/tool-policy";

describe("MapAble agent registry", () => {
  it("defines at least five specialist agents", () => {
    const ids = listAgentConfigs().map((c) => c.id);
    expect(ids).toContain("participant_support");
    expect(ids).toContain("provider_operations");
    expect(ids).toContain("quality_safeguards");
    expect(ids).toContain("billing_pricing");
    expect(ids).toContain("telehealth_intake");
  });

  it("does not allow execute actions on participant support", () => {
    const config = getAgentConfig("participant_support");
    expect(config.canExecuteActions).toBe(false);
    expect(config.forbiddenTools).toContain("approve_invoice");
  });
});

describe("orchestrator routing", () => {
  it("routes invoice questions to billing_pricing", () => {
    const r = routeOrchestrator("Explain this invoice");
    expect(r.chosenAgentId).toBe("billing_pricing");
  });

  it("routes provider search to provider_finder", () => {
    const r = routeOrchestrator("Find a support worker near me");
    expect(r.chosenAgentId).toBe("provider_finder");
  });

  it("resolveAgentId uses orchestrator when not specified", () => {
    expect(resolveAgentId(undefined, "I want to complain")).toBe("quality_safeguards");
  });
});

describe("tool safety policies", () => {
  it("blocks approve_invoice", () => {
    expect(getToolPolicy("approve_invoice").blocked).toBe(true);
  });

  it("blocks close_incident", () => {
    expect(getToolPolicy("close_incident").blocked).toBe(true);
  });

  it("marks complaint draft as requiring confirmation", () => {
    expect(getToolPolicy("create_complaint_draft_only").requiresConfirmation).toBe(
      true
    );
  });

  it("keeps high-risk tool names in forbidden set", () => {
    for (const name of FORBIDDEN_EXECUTE_TOOLS) {
      expect(HIGH_RISK_TOOL_NAMES.has(name)).toBe(true);
    }
  });

  it("has policies for all registry allowed tools that exist in TOOL_POLICIES or default", () => {
    const billing = getAgentConfig("billing_pricing");
    for (const tool of billing.allowedTools) {
      expect(TOOL_POLICIES[tool] ?? getToolPolicy(tool)).toBeDefined();
    }
  });
});

describe("mock refusal patterns", () => {
  it("detects invoice approval refusal intent", () => {
    expect(/approve.*invoice/i.test("Approve this invoice for me")).toBe(true);
  });

  it("detects clinical refusal intent", () => {
    expect(/diagnos|treatment|prescribe/i.test("Diagnose my pain")).toBe(true);
  });

  it("detects incident close requiring human", () => {
    expect(/close.*incident/i.test("Close this incident now")).toBe(true);
  });
});
