import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveJurisdictionFromCoords } from "@/lib/public-transport/jurisdiction";
import {
  getPtCapabilities,
  listConfiguredJurisdictions,
} from "@/lib/public-transport/pt-provider-registry";

describe("public transport registry", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("resolves Sydney coordinates to NSW", () => {
    expect(resolveJurisdictionFromCoords(-33.8688, 151.2093)).toBe("NSW");
  });

  it("resolves Melbourne coordinates to VIC", () => {
    expect(resolveJurisdictionFromCoords(-37.8136, 144.9631)).toBe("VIC");
  });

  it("resolves Brisbane coordinates to QLD", () => {
    expect(resolveJurisdictionFromCoords(-27.4698, 153.0251)).toBe("QLD");
  });

  it("returns NSW capabilities when TfNSW is configured", () => {
    vi.stubEnv("TFNSW_API_KEY", "key");
    vi.stubEnv("TFNSW_TRIP_PLANNER_ENABLED", "true");
    const caps = getPtCapabilities("NSW");
    expect(caps.tripPlanning).toBe(true);
    expect(listConfiguredJurisdictions()).toContain("NSW");
  });

  it("returns unavailable capabilities when PTV is not configured", () => {
    vi.stubEnv("PTV_DEV_ID", "");
    vi.stubEnv("PTV_API_KEY", "");
    const caps = getPtCapabilities("VIC");
    expect(caps.stopSearch).toBe(false);
  });
});
