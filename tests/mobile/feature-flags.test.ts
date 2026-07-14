
import { describe, expect, it } from "vitest";
import {
  DEFAULT_MOBILE_FEATURE_FLAGS,
  isModuleVisible,
  parseMobileFeatureFlags,
} from "@mapable/feature-flags";

describe("mobile feature flags", () => {
  it("fails closed for worker and coordinator by default", () => {
    expect(DEFAULT_MOBILE_FEATURE_FLAGS.MAPABLE_MOBILE_WORKER_ENABLED).toBe(false);
    expect(DEFAULT_MOBILE_FEATURE_FLAGS.MAPABLE_MOBILE_COORDINATOR_ENABLED).toBe(false);
    expect(DEFAULT_MOBILE_FEATURE_FLAGS.MAPABLE_PAYMENT_EXECUTION_ENABLED).toBe(false);
  });

  it("parses bootstrap flag payload", () => {
    const flags = parseMobileFeatureFlags({
      MAPABLE_MOBILE_WORKER_ENABLED: "true",
    });
    expect(flags.MAPABLE_MOBILE_WORKER_ENABLED).toBe(true);
    expect(isModuleVisible(flags, "worker")).toBe(true);
  });
});
