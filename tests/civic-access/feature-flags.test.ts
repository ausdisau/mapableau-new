import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getCivicFeatureFlags,
  getCivicMode,
  isCivicEnabled,
  isCivicFlagEnabled,
} from "@/lib/civic-access/feature-flags";

describe("civic feature flags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults civic off outside development", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MAPABLE_CIVIC_ENABLED", "");
    vi.stubEnv("MAPABLE_CIVIC_ASSET_REGISTRY_ENABLED", "");
    delete process.env.MAPABLE_CIVIC_ENABLED;
    delete process.env.MAPABLE_CIVIC_ASSET_REGISTRY_ENABLED;
    expect(isCivicEnabled()).toBe(false);
    expect(isCivicFlagEnabled("assetRegistry")).toBe(false);
    expect(getCivicFeatureFlags().observatory).toBe(false);
  });

  it("requires civicEnabled before pillar flags apply", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MAPABLE_CIVIC_ENABLED", "false");
    vi.stubEnv("MAPABLE_CIVIC_ASSET_REGISTRY_ENABLED", "true");
    expect(isCivicFlagEnabled("assetRegistry")).toBe(false);
  });

  it("enables registry when both flags are true", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MAPABLE_CIVIC_ENABLED", "true");
    vi.stubEnv("MAPABLE_CIVIC_ASSET_REGISTRY_ENABLED", "true");
    expect(isCivicFlagEnabled("assetRegistry")).toBe(true);
  });

  it("defaults mode to shadow", () => {
    delete process.env.MAPABLE_CIVIC_MODE;
    expect(getCivicMode()).toBe("shadow");
  });
});
