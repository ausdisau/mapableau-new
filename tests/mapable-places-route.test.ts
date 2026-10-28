import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { listPublishedPlaces } from "@/lib/access/map/access-place-service";
import { GET, OPTIONS } from "@/app/api/places/prototype/route";

vi.mock("@/lib/access/map/access-place-service", () => ({
  listPublishedPlaces: vi.fn(),
}));

const api = "http://localhost:3000/api/places/prototype";
const localExpo = "http://localhost:8081";

beforeEach(() => {
  vi.stubEnv("MAPABLE_PLACES_PROTOTYPE_ENABLED", "true");
  vi.stubEnv("NODE_ENV", "development");
  vi.mocked(listPublishedPlaces).mockResolvedValue([]);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

describe("MapAble Places preview API", () => {
  it("fails closed when the server flag is off", async () => {
    vi.stubEnv("MAPABLE_PLACES_PROTOTYPE_ENABLED", "false");
    const res = await GET(new Request(api));
    expect(res.status).toBe(404);
    expect(listPublishedPlaces).not.toHaveBeenCalled();
  });

  it("exposes only read-only published-place summaries", async () => {
    const res = await GET(new Request(api));
    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload).toMatchObject({
      places: [],
      evidenceStatus: "directory-summary-only",
    });
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(listPublishedPlaces).toHaveBeenCalledWith(50);
  });

  it("allows an exact local Expo origin without credential sharing", async () => {
    const res = await GET(new Request(api, {
      headers: { Origin: localExpo },
    }));
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe(localExpo);
    expect(res.headers.get("access-control-allow-credentials")).toBeNull();
    const preflight = await OPTIONS(new Request(api, {
      method: "OPTIONS",
      headers: { Origin: localExpo, "Access-Control-Request-Method": "GET" },
    }));
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("access-control-allow-methods")).toContain("GET");
  });

  it("rejects unapproved origins and never makes a database query", async () => {
    const res = await GET(new Request(api, {
      headers: { Origin: "https://unapproved.example.net" },
    }));
    expect(res.status).toBe(403);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
    expect(listPublishedPlaces).not.toHaveBeenCalled();
  });

  it("returns a non-sensitive service-unavailable response on directory failure", async () => {
    vi.mocked(listPublishedPlaces).mockRejectedValue(new Error("Private database details"));
    const res = await GET(new Request(api));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain("unavailable");
    expect(JSON.stringify(body)).not.toContain("Private database details");
  });
});
