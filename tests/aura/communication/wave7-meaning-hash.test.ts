import { describe, expect, it } from "vitest";

import { computeMeaningHash } from "@/lib/aura/communication";

describe("Wave 7 — computeMeaningHash", () => {
  it("includes steps in the canonical SHA-256 payload", () => {
    const base = {
      purpose: "visit",
      routeDirections: ["Go to Entrance B"],
    };
    const withStepsA = computeMeaningHash({
      ...base,
      steps: ["Go to Entrance B", "Use western lift"],
    });
    const withStepsB = computeMeaningHash({
      ...base,
      steps: ["Go to Entrance B", "Use eastern lift"],
    });
    const withoutSteps = computeMeaningHash(base);

    expect(withStepsA).not.toBe(withStepsB);
    expect(withStepsA).not.toBe(withoutSteps);
    expect(withStepsA).toMatch(/^[a-f0-9]{64}$/);
  });
});
