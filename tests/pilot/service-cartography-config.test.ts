import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  isServiceCartographyPilotEnabled,
  isServiceCartographyPreviewEnabled,
  serviceCartographyConfig,
} from "@/lib/config/service-cartography";

describe("Service Cartography pilot config", () => {
  beforeEach(() => {
    vi.stubEnv("MAPABLE_SERVICE_CARTOGRAPHY_PILOT", undefined);
    vi.stubEnv("MAPABLE_SERVICE_CARTOGRAPHY_SYNTHETIC_ONLY", undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults fail-closed and is not a live matching or booking engine", () => {
    expect(isServiceCartographyPilotEnabled()).toBe(false);
    expect(isServiceCartographyPreviewEnabled()).toBe(false);
    expect(serviceCartographyConfig.syntheticOnly).toBe(true);
    expect(serviceCartographyConfig.productionClaimStatus).toBe("not_claimable");
    expect(serviceCartographyConfig.isLiveMatchingEngine).toBe(false);
    expect(serviceCartographyConfig.isBookingEngine).toBe(false);
    expect(serviceCartographyConfig.autoAssignment).toBe(false);
  });
});
