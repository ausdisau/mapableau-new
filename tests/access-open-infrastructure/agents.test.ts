import { afterEach, describe, expect, it } from "vitest";

import { invokeBoundedAgentTool } from "@/lib/access/agents/agents";
import { canInvokeAgentTool } from "@/lib/access/agents/tools";
import { authorityAllows } from "@/lib/access/agents/authority";

describe("bounded agents", () => {
  afterEach(() => {
    delete process.env.MAPABLE_OPEN_INFRASTRUCTURE_ENABLED;
    delete process.env.MAPABLE_AGENTIC_ACCESS_ENABLED;
  });

  it("L2 cannot submit civic without L3", () => {
    const check = canInvokeAgentTool("L2", "submit_civic_issue");
    expect(check.allowed).toBe(false);
  });

  it("civic draft requires human approval", () => {
    const draftCheck = canInvokeAgentTool("L2", "draft_civic_issue");
    expect(draftCheck.allowed).toBe(true);
    const tool = invokeBoundedAgentTool({
      agentId: "civic_drafting_agent",
      toolId: "draft_civic_issue",
    });
    expect(tool.ok).toBe(false);
  });

  it("L3 civic submit needs human approval flag", () => {
    process.env.MAPABLE_OPEN_INFRASTRUCTURE_ENABLED = "true";
    process.env.MAPABLE_AGENTIC_ACCESS_ENABLED = "true";

    const without = invokeBoundedAgentTool({
      agentId: "civic_drafting_agent",
      toolId: "submit_civic_issue",
    });
    expect(without.ok).toBe(false);

    const withApproval = invokeBoundedAgentTool({
      agentId: "civic_drafting_agent",
      toolId: "submit_civic_issue",
      humanApproved: true,
    });
    // civic_drafting_agent is L2 — still cannot submit
    expect(withApproval.ok).toBe(false);
  });

  it("never allows fabricated evidence", () => {
    expect(authorityAllows("L3", "canFabricateEvidence")).toBe(false);
  });
});
