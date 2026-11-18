import { afterEach, describe, expect, it } from "vitest";

import {
  isServiceCartographyPilotEnabled,
  serviceCartographyConfig,
} from "@/lib/config/service-cartography";

describe("Service Cartography pilot config", () => {
  afterEach(() => {
    delete process.env.MAPABLE_SERVICE_CARTOGRAPHY_PILOT;
    delete process.env.MAPABLE_SERVICE_CARTOGRAPHY_SYNTHETIC_ONLY;
  });

  it("defaults fail-closed and is not a live matching or booking engine", () => {
    expect(isServiceCartographyPilotEnabled()).toBe(false);
    expect(serviceCartographyConfig.syntheticOnly).toBe(true);
    expect(serviceCartographyConfig.productionClaimStatus).toBe("not_claimable");
    expect(serviceCartographyConfig.isLiveMatchingEngine).toBe(false);
    expect(serviceCartographyConfig.isBookingEngine).toBe(false);
    expect(serviceCartographyConfig.autoAssignment).toBe(false);
  });
});
