import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getGoogleMapsRegion,
  isGoogleMapsConfigured,
  isGoogleMapsEnabled,
  isGoogleMapsPublicEnabled,
} from "@/lib/geocoding/google-config";

describe("google-config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is disabled by default", () => {
    vi.stubEnv("GOOGLE_MAPS_ENABLED", "false");
    expect(isGoogleMapsEnabled()).toBe(false);
    expect(isGoogleMapsConfigured()).toBe(false);
  });

  it("requires API key when enabled", () => {
    vi.stubEnv("GOOGLE_MAPS_ENABLED", "true");
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "");
    expect(isGoogleMapsConfigured()).toBe(false);

    vi.stubEnv("GOOGLE_MAPS_API_KEY", "secret");
    expect(isGoogleMapsConfigured()).toBe(true);
  });

  it("defaults region to au", () => {
    vi.stubEnv("GOOGLE_MAPS_REGION", "");
    expect(getGoogleMapsRegion()).toBe("au");
  });

  it("reads public UI flag", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_ENABLED", "true");
    expect(isGoogleMapsPublicEnabled()).toBe(true);
  });
});
