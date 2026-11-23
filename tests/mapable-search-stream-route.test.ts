import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/mapable-search/stream/route";
import type { MapAbleSearchResponse } from "@/lib/search/mapable-search-core";
import { readPublicSearchStreamChunk } from "@/lib/search/mapable-stream-contract";

const mocks = vi.hoisted(() => ({
  searchMapAble: vi.fn(),
}));

vi.mock("@/lib/search/mapable-search-service", () => ({
  searchMapAble: mocks.searchMapAble,
}));
vi.mock("@/lib/api/ip-rate-limit", () => ({
  getClientIp: () => "127.0.0.1",
  checkIpRateLimit: () => true,
}));

const publicResult: MapAbleSearchResponse = {
  results: [{
    id: "providers",
    kind: "module",
    vertical: "providers",
    title: "Provider Finder",
    description: "Find public provider directory entries.",
    href: "/provider-finder",
    provenance: "mapable_navigation",
    sourceLabel: "MapAble public module navigation",
    registration: "not_independently_verified",
    workerScreening: "not_independently_verified",
    accessFit: "unknown",
    availability: "unknown",
  }],
  sourceState: "navigation_only",
  providerIndexEnabled: false,
  resultCount: 1,
  warnings: ["Imported data does not establish current registration."],
};

function request(body: unknown): Request {
  return new Request("http://localhost/api/mapable-search/stream", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  mocks.searchMapAble.mockReset();
});

describe("bounded public streaming API", () => {
  it("is disabled by default, even for a correctly shaped request", async () => {
    vi.stubEnv("MAPABLE_SEARCH_STREAM_ENABLED", "false");
    const response = await POST(request({
      message: "Accessible transport",
      vertical: "transport",
      publicSearchApproved: true,
    }));
    expect(response.status).toBe(404);
    expect(mocks.searchMapAble).not.toHaveBeenCalled();
  });

  it("fails closed for production unless distributed ingress protection is reviewed", async () => {
    vi.stubEnv("MAPABLE_SEARCH_STREAM_ENABLED", "true");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("MAPABLE_SEARCH_STREAM_DISTRIBUTED_GATE_VERIFIED", "false");
    const response = await POST(request({
      message: "Accessible transport",
      vertical: "transport",
      publicSearchApproved: true,
    }));
    expect(response.status).toBe(404);
  });

  it("refuses private identifiers and missing approval before any provider lookup", async () => {
    vi.stubEnv("MAPABLE_SEARCH_STREAM_ENABLED", "true");
    vi.stubEnv("VERCEL_ENV", "preview");
    const response = await POST(request({
      message: "Find providers",
      vertical: "providers",
      publicSearchApproved: true,
      participantId: "private-record",
    }));
    expect(response.status).toBe(400);
    expect(mocks.searchMapAble).not.toHaveBeenCalled();
    const second = await POST(request({
      message: "Find providers", vertical: "providers", publicSearchApproved: false,
    }));
    expect(second.status).toBe(400);
  });

  it("streams sources, results, grounded explanation and spatial unavailability", async () => {
    vi.stubEnv("MAPABLE_SEARCH_STREAM_ENABLED", "true");
    vi.stubEnv("VERCEL_ENV", "preview");
    mocks.searchMapAble.mockResolvedValue(publicResult);
    const response = await POST(request({
      message: "NDIS physio", vertical: "providers", publicSearchApproved: true,
    }));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(response.headers.get("cache-control")).toContain("no-store");
    const body = await response.text();
    const events = readPublicSearchStreamChunk(body).events;
    expect(events.map((item) => item.type)).toEqual([
      "search.started", "message.delta", "source.found", "result.upsert",
      "spatial.updated", "message.delta", "message.delta", "search.completed",
    ]);
    expect(events.find((item) => item.type === "result.upsert")).toMatchObject({
      result: { registration: "not_independently_verified", accessFit: "unknown" },
    });
    expect(events.find((item) => item.type === "spatial.updated")).toMatchObject({
      available: false,
    });
    expect(mocks.searchMapAble).toHaveBeenCalledWith({ q: "NDIS physio", vertical: "providers" });
  });

  it("does not fabricate providers on a source outage", async () => {
    vi.stubEnv("MAPABLE_SEARCH_STREAM_ENABLED", "true");
    vi.stubEnv("VERCEL_ENV", "preview");
    mocks.searchMapAble.mockRejectedValue(new Error("database connection unavailable"));
    const response = await POST(request({
      message: "Clinic", vertical: "care", publicSearchApproved: true,
    }));
    const events = readPublicSearchStreamChunk(await response.text()).events;
    expect(events.some((item) => item.type === "result.upsert")).toBe(false);
    expect(events.at(-1)).toMatchObject({ type: "search.error" });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
