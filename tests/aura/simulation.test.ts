import { describe, expect, it } from "vitest";

import { hashSimulationInputs, simulatePlan } from "@/lib/aura/plans/simulation";

describe("simulatePlan", () => {
  it("records zero external writes for a valid plan", () => {
    const result = simulatePlan({
      plan: {
        allowedActionSlugs: ["a1"],
        allowedToolIds: ["tool_local"],
        steps: [
          { stepIndex: 0, actionSlug: "a1", toolId: "tool_local", parents: [] },
        ],
      },
      inputs: { foo: "bar" },
    });
    expect(result.ok).toBe(true);
    expect(result.externalWrites).toBe(0);
    expect(result.stepsSimulated).toBe(1);
  });

  it("warns and does not call MCP-prefixed tools", () => {
    const result = simulatePlan({
      plan: {
        allowedActionSlugs: ["a1"],
        allowedToolIds: ["mcp:some-server"],
        steps: [
          { stepIndex: 0, actionSlug: "a1", toolId: "mcp:some-server", parents: [] },
        ],
      },
      inputs: {},
    });
    expect(result.externalWrites).toBe(0);
    expect(result.warnings.some((w) => w.includes("MCP"))).toBe(true);
  });

  it("warns for A2A tools without external write", () => {
    const result = simulatePlan({
      plan: {
        allowedActionSlugs: ["a1"],
        allowedToolIds: ["a2a:peer"],
        steps: [
          { stepIndex: 0, actionSlug: "a1", toolId: "a2a:peer", parents: [] },
        ],
      },
      inputs: {},
    });
    expect(result.externalWrites).toBe(0);
    expect(result.warnings.some((w) => w.includes("A2A"))).toBe(true);
  });

  it("input hash is stable for the same plan+inputs", () => {
    const input = {
      plan: {
        allowedActionSlugs: ["a"],
        allowedToolIds: [],
        steps: [{ stepIndex: 0, actionSlug: "a", parents: [] }],
      },
      inputs: { a: 1, b: 2 },
    };
    expect(hashSimulationInputs(input)).toBe(hashSimulationInputs(input));
  });

  it("input hash changes when inputs change", () => {
    const base = {
      plan: {
        allowedActionSlugs: ["a"],
        allowedToolIds: [],
        steps: [{ stepIndex: 0, actionSlug: "a", parents: [] }],
      },
      inputs: { a: 1 },
    };
    const changed = { ...base, inputs: { a: 2 } };
    expect(hashSimulationInputs(base)).not.toBe(hashSimulationInputs(changed));
  });
});
