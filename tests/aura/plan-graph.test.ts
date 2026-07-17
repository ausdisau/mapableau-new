import { describe, expect, it } from "vitest";

import { validatePlanGraph } from "@/lib/aura/plans/graph";

describe("validatePlanGraph", () => {
  const allowedActionSlugs = ["a1", "a2", "a3"];
  const allowedToolIds = ["tool1", "tool2"];

  it("accepts a simple linear DAG", () => {
    const result = validatePlanGraph({
      allowedActionSlugs,
      allowedToolIds,
      steps: [
        { stepIndex: 0, actionSlug: "a1", parents: [] },
        { stepIndex: 1, actionSlug: "a2", parents: [0] },
        { stepIndex: 2, actionSlug: "a3", parents: [1] },
      ],
    });
    expect(result.valid).toBe(true);
    expect(result.depth).toBe(2);
  });

  it("rejects unknown action slug", () => {
    const result = validatePlanGraph({
      allowedActionSlugs,
      allowedToolIds,
      steps: [{ stepIndex: 0, actionSlug: "unknown_action", parents: [] }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "unknown_action")).toBe(true);
  });

  it("rejects unknown tool", () => {
    const result = validatePlanGraph({
      allowedActionSlugs,
      allowedToolIds,
      steps: [
        { stepIndex: 0, actionSlug: "a1", toolId: "tool_evil", parents: [] },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "unknown_tool")).toBe(true);
  });

  it("rejects cycle", () => {
    const result = validatePlanGraph({
      allowedActionSlugs,
      allowedToolIds,
      steps: [
        { stepIndex: 0, actionSlug: "a1", parents: [1] },
        { stepIndex: 1, actionSlug: "a2", parents: [0] },
      ],
    });
    expect(result.valid).toBe(false);
    expect(
      result.errors.some(
        (e) => e.code === "cycle_detected" || e.code === "forward_reference"
      )
    ).toBe(true);
  });

  it("rejects unbounded loop", () => {
    const result = validatePlanGraph({
      allowedActionSlugs,
      allowedToolIds,
      steps: [
        {
          stepIndex: 0,
          actionSlug: "a1",
          parents: [],
          loopKind: "unbounded",
        },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "unbounded_loop")).toBe(true);
  });

  it("rejects bounded loop missing max iterations", () => {
    const result = validatePlanGraph({
      allowedActionSlugs,
      allowedToolIds,
      steps: [
        {
          stepIndex: 0,
          actionSlug: "a1",
          parents: [],
          loopKind: "bounded",
          loopMaxIterations: 0,
        },
      ],
    });
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.code === "loop_iteration_cap_missing")
    ).toBe(true);
  });

  it("rejects forward reference (parent >= current index)", () => {
    const result = validatePlanGraph({
      allowedActionSlugs,
      allowedToolIds,
      steps: [
        { stepIndex: 0, actionSlug: "a1", parents: [1] },
        { stepIndex: 1, actionSlug: "a2", parents: [] },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "forward_reference")).toBe(true);
  });

  it("rejects duplicate step index", () => {
    const result = validatePlanGraph({
      allowedActionSlugs,
      allowedToolIds,
      steps: [
        { stepIndex: 0, actionSlug: "a1", parents: [] },
        { stepIndex: 0, actionSlug: "a2", parents: [] },
      ],
    });
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.code === "duplicate_step_index")
    ).toBe(true);
  });
});
