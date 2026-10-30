import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requireApiSession = vi.fn();
const readProfile = vi.fn();
const saveProfile = vi.fn();
const deleteProfile = vi.fn();

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiSession: (...args: unknown[]) => requireApiSession(...args),
}));
vi.mock("@/lib/api/ip-rate-limit", () => ({
  checkIpRateLimit: () => true,
  getClientIp: () => "127.0.0.1",
}));
vi.mock("@/lib/provider/finder/search-profile-service", () => ({
  readProviderSearchProfile: (...args: unknown[]) => readProfile(...args),
  saveProviderSearchProfile: (...args: unknown[]) => saveProfile(...args),
  deleteProviderSearchProfile: (...args: unknown[]) => deleteProfile(...args),
}));

import { DELETE, GET, PUT } from "@/app/api/providers/search-profile/route";
import { PROVIDER_SEARCH_CONSENT_VERSION } from "@/lib/provider/finder/search-profile-contract";

const endpoint = "http://localhost/api/providers/search-profile";
const signedIn = { id: "user-1", primaryRole: "participant", roles: ["participant"] };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("MAPABLE_PROVIDER_SEARCH_PROFILE_ENABLED", "true");
  requireApiSession.mockResolvedValue(signedIn);
  readProfile.mockResolvedValue(null);
  deleteProfile.mockResolvedValue(undefined);
  saveProfile.mockResolvedValue({
    preferences: {
      state: "NSW", serviceTypes: ["support_coordination"],
      communicationModes: [], delivery: "any", fundingManagement: "unspecified",
    },
    consentVersion: PROVIDER_SEARCH_CONSENT_VERSION,
    consentGrantedAt: "2026-10-30T00:00:00Z",
    updatedAt: "2026-10-30T00:00:00Z",
  });
});
afterEach(() => vi.unstubAllEnvs());

describe("owner-only consented provider search profile API", () => {
  it("refuses access without an authenticated user", async () => {
    requireApiSession.mockResolvedValue(Response.json({ error: "Unauthorized" }, { status: 401 }));
    expect((await GET()).status).toBe(401);
    expect(readProfile).not.toHaveBeenCalled();
  });

  it("keeps the sensitive profile feature disabled by default", async () => {
    vi.stubEnv("MAPABLE_PROVIDER_SEARCH_PROFILE_ENABLED", "false");
    expect((await GET()).status).toBe(503);
    expect(readProfile).not.toHaveBeenCalled();
  });

  it("reads only the account holder's profile", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(readProfile).toHaveBeenCalledWith("user-1");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects cross-origin writes even when a session exists", async () => {
    const response = await PUT(new Request(endpoint, {
      method: "PUT", headers: { Origin: "https://attacker.example", "Content-Type": "application/json" },
      body: JSON.stringify({ consent: true, consentVersion: PROVIDER_SEARCH_CONSENT_VERSION, preferences: {} }),
    }));
    expect(response.status).toBe(403);
    expect(saveProfile).not.toHaveBeenCalled();
  });

  it("does not save data without a valid purpose-specific consent", async () => {
    const response = await PUT(new Request(endpoint, {
      method: "PUT", headers: { Origin: "http://localhost", "Content-Type": "application/json" },
      body: JSON.stringify({ consent: false, consentVersion: PROVIDER_SEARCH_CONSENT_VERSION, preferences: {} }),
    }));
    expect(response.status).toBe(400);
    expect(saveProfile).not.toHaveBeenCalled();
  });

  it("ignores client identities and always saves as the authenticated user", async () => {
    const response = await PUT(new Request(endpoint, {
      method: "PUT", headers: { Origin: "http://localhost", "Content-Type": "application/json" },
      body: JSON.stringify({
        consent: true, consentVersion: PROVIDER_SEARCH_CONSENT_VERSION,
        preferences: {
          state: "NSW", serviceTypes: ["support_coordination"],
          communicationModes: [], delivery: "any", fundingManagement: "unspecified",
        },
      }),
    }));
    expect(response.status).toBe(200);
    expect(saveProfile).toHaveBeenCalledWith(expect.objectContaining({
      userId: "user-1", actorRole: "participant",
    }));
  });

  it("withdraws and deletes profile data only for the session owner", async () => {
    const response = await DELETE(new Request(endpoint, {
      method: "DELETE", headers: { Origin: "http://localhost" },
    }));
    expect(response.status).toBe(200);
    expect(deleteProfile).toHaveBeenCalledWith({ userId: "user-1", actorRole: "participant" });
  });
});
