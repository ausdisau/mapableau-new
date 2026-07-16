import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => true,
    getPlatform: () => "android",
  },
}));

describe("admob-config", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ADMOB_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_ADMOB_TESTING", "true");
    vi.stubEnv("NEXT_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_ADMOB_BANNER_UNIT_ID", "");
  });

  it("uses Google test banner unit when testing mode is on", async () => {
    const { getAdMobConfig, ADMOB_TEST_BANNER_UNIT_ID } = await import(
      "@/lib/capacitor/admob-config"
    );
    expect(getAdMobConfig()?.bannerUnitId).toBe(ADMOB_TEST_BANNER_UNIT_ID);
  });

  it("prefers explicit Android banner unit id", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMOB_TESTING", "false");
    vi.stubEnv(
      "NEXT_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID",
      "ca-app-pub-123/456",
    );

    const { getAdMobConfig } = await import("@/lib/capacitor/admob-config");
    expect(getAdMobConfig()?.bannerUnitId).toBe("ca-app-pub-123/456");
  });

  it("can be disabled via env", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMOB_ENABLED", "false");
    const { isAdMobEnabled, getAdMobConfig } = await import(
      "@/lib/capacitor/admob-config"
    );
    expect(isAdMobEnabled()).toBe(false);
    expect(getAdMobConfig()).toBeNull();
  });
});
