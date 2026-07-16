import { describe, expect, it } from "vitest";

import {
  buildTransportFeaturesResponse,
  getTransportCapabilityClaims,
  isProductionReady,
} from "@/lib/transport/production-claims";

describe("transport production claims", () => {
  it("exposes only production_ready capabilities as available_now bucket items", () => {
    const claims = getTransportCapabilityClaims();
    for (const c of claims) {
      if (c.publicBucket === "available_now") {
        expect(c.state).toBe("production_ready");
      }
    }
  });

  it("keeps eligibility and routing out of production_ready until gates pass", () => {
    expect(isProductionReady("driver_vehicle_eligibility")).toBe(false);
    expect(isProductionReady("advisory_routing")).toBe(false);
    expect(isProductionReady("public_safety_model")).toBe(true);
  });

  it("returns recommended public wording in features response", () => {
    const res = buildTransportFeaturesResponse();
    expect(res.availableNow.length).toBeGreaterThan(0);
    expect(res.comingNext.some((s) => s.includes("eligibility checks"))).toBe(true);
    expect(res.comingNext.some((s) => s.toLowerCase().includes("advisory"))).toBe(
      true
    );
    expect(res.capabilities.some((c) => c.id === "advisory_routing")).toBe(true);
  });
});
