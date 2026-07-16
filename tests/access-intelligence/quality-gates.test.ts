import { describe, expect, it } from "vitest";

import { evaluateExpansionQualityGates } from "@/lib/access-intelligence/quality-gates";
import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";

describe("Wave 5 expansion quality gates", () => {
  it("passes when programme invariants hold", () => {
    const result = evaluateExpansionQualityGates({
      canonicalPlaceBinding: accessIntelligenceFlags.canonicalPlaceBinding,
      liveAdaptersDefaultOff:
        !accessIntelligenceFlags.liveBms &&
        !accessIntelligenceFlags.liveMessaging,
      expiredEvidenceTreatedAsUnknown: true,
      regressionPackPresent: true,
      recoveryRequiresApproval: true,
      guideFactsBound: true,
      contributionPointsAffectConfidence: false,
      widgetHasListAlternative: true,
      smallCellSuppression: true,
      paidPlanChangesConfidence: false,
      playwrightSmokeGreen: true,
    });
    expect(result.passed).toBe(true);
    expect(result.gates).toHaveLength(11);
  });

  it("fails when paid plans would bias confidence", () => {
    const result = evaluateExpansionQualityGates({
      canonicalPlaceBinding: true,
      liveAdaptersDefaultOff: true,
      expiredEvidenceTreatedAsUnknown: true,
      regressionPackPresent: true,
      recoveryRequiresApproval: true,
      guideFactsBound: true,
      contributionPointsAffectConfidence: false,
      widgetHasListAlternative: true,
      smallCellSuppression: true,
      paidPlanChangesConfidence: true,
      playwrightSmokeGreen: true,
    });
    expect(result.passed).toBe(false);
    expect(
      result.gates.find((g) => g.id === "no_paid_plan_score_bias")?.passed,
    ).toBe(false);
  });
});
