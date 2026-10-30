import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requireApiSession = vi.fn();
const readProfile = vi.fn();
const lookup = vi.fn();

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiSession: (...args: unknown[]) => requireApiSession(...args),
}));
vi.mock("@/lib/api/ip-rate-limit", () => ({
  checkIpRateLimit: () => true,
  getClientIp: () => "127.0.0.1",
}));
vi.mock("@/lib/provider/finder/search-profile-service", () => ({
  readProviderSearchProfile: (...args: unknown[]) => readProfile(...args),
}));
vi.mock("@/lib/provider/finder/provider-chat-matching", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/provider/finder/provider-chat-matching")>();
  return {
    ...original,
    lookupMatchingProviderRecords: (...args: unknown[]) => lookup(...args),
  };
});

import { POST } from "@/app/api/providers/chat-search/route";

function request(message: string, other: Record<string, unknown> = {}, origin = true) {
  return new Request("http://localhost/api/providers/chat-search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(origin ? { Origin: "http://localhost" } : {}),
    },
    body: JSON.stringify({ message, ...other }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("MAPABLE_PROVIDER_SEARCH_PROFILE_ENABLED", "true");
  requireApiSession.mockResolvedValue({
    id: "participant-A", primaryRole: "participant", roles: ["participant"],
  });
  readProfile.mockResolvedValue(null);
  lookup.mockResolvedValue({ results: [], hasMore: false });
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/providers/chat-search", () => {
  it("rejects unauthenticated callers", async () => {
    requireApiSession.mockResolvedValue(Response.json({ error: "Unauthorized" }, { status: 401 }));
    const response = await POST(request("support workers in NSW"));
    expect(response.status).toBe(401);
    expect(lookup).not.toHaveBeenCalled();
  });

  it("does not invent a precise location when user asks near me", async () => {
    const response = await POST(request("Find support workers near me"));
    expect(response.status).toBe(422);
    expect(lookup).not.toHaveBeenCalled();
  });

  it("rejects missing Origin for cookie-based requests", async () => {
    const response = await POST(request("support workers in NSW", {}, false));
    expect(response.status).toBe(403);
    expect(lookup).not.toHaveBeenCalled();
  });

  it("requires a saved and consented profile before applying one", async () => {
    const response = await POST(request("Find support workers", { useSavedProfile: true }));
    expect(response.status).toBe(409);
    expect(readProfile).toHaveBeenCalledWith("participant-A");
    expect(lookup).not.toHaveBeenCalled();
  });

  it("does not implicitly load a stored profile when user opted out", async () => {
    const response = await POST(request("support coordination in NSW"));
    expect(response.status).toBe(200);
    expect(readProfile).not.toHaveBeenCalled();
    expect(lookup).toHaveBeenCalled();
  });

  it("streams a provider-level warning instead of reporting a worker as cleared", async () => {
    lookup.mockResolvedValue({
      results: [{
        source_id: "ndis-provider-1",
        provider_name: "Example Support Organisation",
        suburb: "St Ives", state: "NSW", postcode: "2075",
        latitude: -33.73, longitude: 151.17, services: ["Disability Support Worker (includes Mental Health or Peer Worker)"],
        registration_groups: ["Daily Personal Activities"],
        updated_at: new Date("2026-10-01T00:00:00Z"),
        phone: null, email: null, website: null,
      }],
      hasMore: false,
    });
    const response = await POST(request("Find support workers in NSW"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/x-ndjson");
    const body = (await response.text()).split("\n").filter(Boolean).map((line) => JSON.parse(line));
    expect(body.some((entry) => entry.type === "message" && entry.text.includes("Individual workers are not returned"))).toBe(true);
    expect(body.some((entry) => entry.type === "provider" && entry.provider.workerScreening === "Not independently verified")).toBe(true);
    expect(body.some((entry) => entry.type === "complete" && entry.count === 1)).toBe(true);
  });
});
