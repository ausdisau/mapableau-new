import { afterEach, describe, expect, it } from "vitest";
import { fullLifeHarnessConfig } from "@/lib/config/full-life";

const FLAGS = [
  "MAPABLE_FULL_LIFE_HARNESS_ENABLED",
  "MAPABLE_FULL_LIFE_HARNESS_SHADOW_ONLY",
];

afterEach(() => FLAGS.forEach((flag) => delete process.env[flag]));

describe("Full Life config", () => {
  it("fails closed", () => {
    expect(fullLifeHarnessConfig.enabled).toBe(false);
    expect(fullLifeHarnessConfig.shadowOnly).toBe(true);
    expect(fullLifeHarnessConfig.mayInfluenceRuntime).toBe(false);
  });

  it("does not influence runtime while shadow-only", () => {
    process.env.MAPABLE_FULL_LIFE_HARNESS_ENABLED = "true";
    process.env.MAPABLE_FULL_LIFE_HARNESS_SHADOW_ONLY = "true";
    expect(fullLifeHarnessConfig.mayInfluenceRuntime).toBe(false);
  });
});
