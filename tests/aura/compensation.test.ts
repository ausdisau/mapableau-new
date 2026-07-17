import { describe, expect, it } from "vitest";

import { requiresCompensation } from "@/lib/aura/execution/compensation";

describe("compensation", () => {
  it("execution_unknown always requires compensation", () => {
    expect(requiresCompensation("execution_unknown", "low_readonly")).toBe(true);
  });

  it("failed high_irreversible requires compensation", () => {
    expect(requiresCompensation("failed", "high_irreversible")).toBe(true);
  });

  it("failed low_readonly does not require compensation", () => {
    expect(requiresCompensation("failed", "low_readonly")).toBe(false);
  });
});
