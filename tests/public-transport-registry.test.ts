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

  it("resolves Canberra coordinates to ACT (not NSW)", () => {
    expect(resolveJurisdictionFromCoords(-35.2809, 149.13)).toBe("ACT");
  });

  it("resolves Adelaide coordinates to SA", () => {
    expect(resolveJurisdictionFromCoords(-34.9285, 138.6007)).toBe("SA");
  });

  it("resolves Perth coordinates to WA", () => {
    expect(resolveJurisdictionFromCoords(-31.9505, 115.8605)).toBe("WA");
  });

  it("resolves Hobart coordinates to TAS", () => {
    expect(resolveJurisdictionFromCoords(-42.8821, 147.3272)).toBe("TAS");
  });

  it("resolves Darwin coordinates to NT", () => {
    expect(resolveJurisdictionFromCoords(-12.4634, 130.8456)).toBe("NT");
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

  it("returns SA capabilities when Adelaide Metro GTFS is enabled", () => {
    vi.stubEnv("SA_GTFS_ENABLED", "true");
    const caps = getPtCapabilities("SA");
    expect(caps.stopSearch).toBe(true);
    expect(caps.departures).toBe(true);
    expect(caps.disruptions).toBe(true);
  });

  it("returns unavailable ACT capabilities without access key", () => {
    vi.stubEnv("ACT_GTFS_ACCESS_KEY", "");
    const caps = getPtCapabilities("ACT");
    expect(caps.stopSearch).toBe(false);
  });
});
