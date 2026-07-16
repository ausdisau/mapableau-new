import { describe, expect, it } from "vitest";

import {
  buildWidgetPayload,
  runSdkCertificationSuite,
} from "@/lib/access-intelligence/widget";

describe("System 6 widget", () => {
  it("never exposes passport and ignores subscription for confidence", () => {
    const a = buildWidgetPayload({
      accessPlaceId: "p1",
      placeName: "Hall",
      subscriptionPlan: "community",
      features: [
        {
          type: "lift",
          summary: "Unknown",
          source: "none",
          observedAt: null,
          confidenceLabel: "very limited",
          unknown: true,
        },
      ],
      incidents: [{ id: "i1", summary: "Lift outage", severity: "high" }],
    });
    const b = buildWidgetPayload({
      accessPlaceId: "p1",
      placeName: "Hall",
      subscriptionPlan: "enterprise",
      features: a.features,
      incidents: a.incidents,
    });
    expect(a.passportExposed).toBe(false);
    expect(a.unknowns).toContain("lift");
    expect(a.listAlternative.length).toBeGreaterThan(0);
    expect(a.features).toEqual(b.features);
  });

  it("passes sandbox certification when list alternative and defaults hold", () => {
    const payload = buildWidgetPayload({
      accessPlaceId: "p1",
      placeName: "Hall",
      features: [
        {
          type: "step_free",
          summary: "yes",
          source: "assessor",
          observedAt: "2026-01-01",
          confidenceLabel: "good",
          unknown: false,
        },
      ],
      incidents: [],
    });
    const suite = runSdkCertificationSuite({
      hasListAlternative: payload.listAlternative.length > 0,
      passportExposedByDefault: payload.passportExposed,
      subscriptionBiasesConfidence: false,
      originAllowlisted: true,
    });
    expect(suite.passed).toBe(true);
  });
});
