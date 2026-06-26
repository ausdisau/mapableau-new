import { describe, expect, it } from "vitest";

import { calculateProviderTrustScore } from "@/lib/trust/trust-score";
import { computeResponseSlaStatus } from "@/lib/trust/response-sla";
import { buildRequestTimeline } from "@/lib/wedges/request-tracker/status";
import { MOCK_REQUEST_PROGRESS } from "@/lib/wedges/mock-providers";

describe("trust score", () => {
  it("calculates score from evidence categories", () => {
    const result = calculateProviderTrustScore("test", [
      { id: "a", label: "Identity", evidence: "verified", lastChecked: null, notes: null },
      { id: "b", label: "Insurance", evidence: "declared", lastChecked: null, notes: null },
    ]);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });
});

describe("response SLA", () => {
  it("classifies excellent response time", () => {
    expect(computeResponseSlaStatus(4, 0.9)).toBe("excellent");
  });

  it("returns unknown when no data", () => {
    expect(computeResponseSlaStatus(null, null)).toBe("unknown");
  });
});

describe("request timeline", () => {
  it("builds timeline steps from progress", () => {
    const steps = buildRequestTimeline(MOCK_REQUEST_PROGRESS[0]);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.some((s) => s.current)).toBe(true);
  });
});
