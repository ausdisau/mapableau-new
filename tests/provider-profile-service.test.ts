import { describe, expect, it, vi, beforeEach } from "vitest";

import { getPublicProviderProfile } from "@/lib/providers/provider-profile-service";
import { VERIFICATION_DISPLAY } from "@/types/provider-profile";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    provider: { findUnique: vi.fn(async () => null) },
    providerProfile: { findFirst: vi.fn(async () => null) },
    claimedProvider: { findFirst: vi.fn(async () => null) },
  },
}));

vi.mock("@/lib/provider-outlets", () => ({
  fetchProviderOutlets: vi.fn(async () => [
    {
      ABN: "123",
      Prov_N: "Test Care",
      Outletname: "Test Care",
      Address: "1 Main St, Parramatta, NSW 2150",
      Head_Office: "",
      State_cd: "NSW",
      Post_cd: 2150,
      Active: 1,
      RegGroup: "",
      prfsn: "",
      Phone: "",
      Email: "",
      Website: "",
      opnhrs: "",
      Latitude: -33.8,
      Longitude: 151,
    },
  ]),
}));

describe("getPublicProviderProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves directory outlet by slug without private fields", async () => {
    const profile = await getPublicProviderProfile("test-care");
    expect(profile).not.toBeNull();
    expect(profile?.name).toBe("Test Care");
    expect(profile?.verificationDisplay).toBe(
      VERIFICATION_DISPLAY.ndis_registered,
    );
    expect(profile?.showUnverifiedWarning).toBe(false);
    expect(profile?.canRequestSupport).toBe(true);
    // No participant or health fields on public profile type
    expect(profile).not.toHaveProperty("ndisPlan");
    expect(profile).not.toHaveProperty("healthNotes");
  });

  it("returns null for unknown identifier", async () => {
    const profile = await getPublicProviderProfile("does-not-exist-xyz");
    expect(profile).toBeNull();
  });
});
