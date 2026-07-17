import { afterEach, describe, expect, it, vi } from "vitest";

import { assertDemoSeedAllowed } from "@/lib/accountability/demo-guard";

describe("accountability demo seed guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("blocks production seeding", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => assertDemoSeedAllowed()).toThrow(/blocked in production/i);
  });

  it("allows non-production when not explicitly disabled", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("ALLOW_ACCOUNTABILITY_DEMO_SEED", undefined);
    expect(() => assertDemoSeedAllowed()).not.toThrow();
  });
});
