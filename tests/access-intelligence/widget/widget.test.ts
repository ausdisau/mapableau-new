import { describe, expect, it } from "vitest";

import { buildWidgetPayload } from "@/lib/access-intelligence/widget";

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
});
