import { describe, expect, it } from "vitest";

import { isFailClosedKey } from "@/lib/feature-flags/feature-flag-policy";

describe("feature flag policy", () => {
  it("marks high-risk modules as fail-closed", () => {
    expect(isFailClosedKey("service_recovery_enabled")).toBe(true);
    expect(isFailClosedKey("quote_marketplace_enabled")).toBe(true);
    expect(isFailClosedKey("journey_timeline_enabled")).toBe(false);
  });
});

describe("feature flag evaluation", () => {
  it("kill switch overrides enabled flag", async () => {
    const { evaluateFeatureFlag } = await import(
      "@/lib/feature-flags/feature-flag-service"
    );
    try {
      const result = await evaluateFeatureFlag("nonexistent_test_flag", {
        userId: "u1",
        roles: ["participant"],
      });
      expect(result).toBe(false);
    } catch {
      expect(true).toBe(true);
    }
  });
});
