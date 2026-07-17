import { describe, expect, it } from "vitest";

import { calculateReliabilityWindow } from "@/lib/accessops/reliability/availability-windows";

describe("AccessOps reliability unknown minutes", () => {
  it("keeps unknown minutes explicit", () => {
    const result = calculateReliabilityWindow([
      { state: "unknown", minutes: 30, expected: true },
      { state: "verified_available", minutes: 30, expected: true, evidencePresent: true },
    ]);
    expect(result.unknownMinutes).toBe(30);
    expect(result.statusCoveragePercent).toBe(0.5);
  });
});
