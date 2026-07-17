import { describe, expect, it } from "vitest";

import { validateHandoff } from "@/lib/aura/handoffs/service";

describe("handoff service", () => {
  it("requires a reason", () => {
    const r = validateHandoff({
      kind: "agent_to_human",
      toHumanUserId: "u_human",
      contextJson: {},
      reason: "",
    });
    expect(r.ok).toBe(false);
  });

  it("agent_to_agent requires toAgentId", () => {
    const r = validateHandoff({
      kind: "agent_to_agent",
      fromAgentId: "a1",
      contextJson: {},
      reason: "specialist expertise required",
    });
    expect(r.ok).toBe(false);
  });

  it("agent_to_agent cannot handoff to self", () => {
    const r = validateHandoff({
      kind: "agent_to_agent",
      fromAgentId: "a1",
      toAgentId: "a1",
      contextJson: {},
      reason: "why",
    });
    expect(r.ok).toBe(false);
  });

  it("rejects handoff context that attempts authority elevation", () => {
    const r = validateHandoff({
      kind: "agent_to_agent",
      fromAgentId: "a1",
      toAgentId: "a2",
      contextJson: { grantAuthority: true },
      reason: "why",
    });
    expect(r.ok).toBe(false);
  });

  it("accepts a well-formed agent_to_human handoff", () => {
    const r = validateHandoff({
      kind: "agent_to_human",
      toHumanUserId: "u_coordinator",
      contextJson: { note: "please review" },
      reason: "risk tier exceeded envelope",
    });
    expect(r.ok).toBe(true);
  });
});
