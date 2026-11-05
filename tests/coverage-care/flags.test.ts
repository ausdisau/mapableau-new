import { afterEach, describe, expect, it } from "vitest";

describe("Coverage Care feature flags", () => {
  const keys = [
    "MAPABLE_COVERAGE_CARE_ENABLED",
    "MAPABLE_COVERAGE_CARE_BRANDOS_ENABLED",
    "MAPABLE_COVERAGE_CARE_PROVISIONING_PREVIEW_ENABLED",
    "MAPABLE_COVERAGE_CARE_DEMO_ACTOR",
  ] as const;

  afterEach(() => {
    for (const key of keys) delete process.env[key];
    // Force re-read via dynamic import cache bust not needed — config uses getters.
  });

  it("defaults all new flags OFF", async () => {
    for (const key of keys) delete process.env[key];
    const { coverageCareConfig } = await import("@/lib/config/coverage-care");
    expect(coverageCareConfig.enabled).toBe(false);
    expect(coverageCareConfig.brandOsEnabled).toBe(false);
    expect(coverageCareConfig.provisioningPreviewEnabled).toBe(false);
    expect(coverageCareConfig.persistence).toBe("memory");
  });

  it("enables only when env is exactly true", async () => {
    process.env.MAPABLE_COVERAGE_CARE_ENABLED = "true";
    process.env.MAPABLE_COVERAGE_CARE_BRANDOS_ENABLED = "1";
    const { coverageCareConfig } = await import("@/lib/config/coverage-care");
    expect(coverageCareConfig.enabled).toBe(true);
    expect(coverageCareConfig.brandOsEnabled).toBe(false);
  });
});
