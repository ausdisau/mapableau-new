import { describe, expect, it } from "vitest";

import { decideGa } from "@/lib/production-readiness/ga-assessment";

const baseScorecard = {
  assurance: { ready: true, score: 90, blockers: [] as string[] },
  operationalHealth: { availability: 0.999, errorBudgetBurn: 0.1 },
  entitlementsConfigured: true,
  policiesConfigured: true,
  incidentsOpen: 0,
  outstandingSecurityFindings: 0,
  outstandingComplaints: 0,
};

describe("GA assessment (Wave 8)", () => {
  it("does not auto-approve — best possible score is ready_pending_executive", () => {
    expect(decideGa(baseScorecard)).toBe("ready_pending_executive");
  });

  it("is not_ready when assurance not ready", () => {
    expect(
      decideGa({ ...baseScorecard, assurance: { ready: false, score: 30, blockers: [] } })
    ).toBe("not_ready");
  });

  it("is not_ready when there are open incidents or security findings", () => {
    expect(decideGa({ ...baseScorecard, incidentsOpen: 1 })).toBe("not_ready");
    expect(decideGa({ ...baseScorecard, outstandingSecurityFindings: 1 })).toBe(
      "not_ready"
    );
  });

  it("is conditionally_ready when entitlements or policies missing", () => {
    expect(decideGa({ ...baseScorecard, entitlementsConfigured: false })).toBe(
      "conditionally_ready"
    );
    expect(decideGa({ ...baseScorecard, policiesConfigured: false })).toBe(
      "conditionally_ready"
    );
    expect(decideGa({ ...baseScorecard, outstandingComplaints: 1 })).toBe(
      "conditionally_ready"
    );
  });

  it("even a perfect score never produces `approved` from decideGa (executive required)", () => {
    const decision = decideGa(baseScorecard);
    expect(decision).not.toBe("approved");
  });
});
