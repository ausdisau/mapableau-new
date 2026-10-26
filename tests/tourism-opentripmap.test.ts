import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addOpenTripMapStop, getTourismPlaceInTrip, isTourismTrip,
  makeSydneyDemoTrip, moveTourismStop,
} from "@/lib/tourism/demo";
import {
  isOpenTripMapPlace, normaliseOpenTripMapPlaces,
} from "@/lib/tourism/open-trip-map";
import { searchSydneyOpenTripMapPlaces } from "@/lib/tourism/open-trip-map-server";

const retrievedAt = "2026-10-27T00:00:00.000Z";
const raw = {
  xid: "W123456",
  name: "Example Sydney Gallery",
  kinds: "museums,cultural,interesting_places",
  dist: 1250,
  point: { lat: -33.8702, lon: 151.207 },
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("OpenTripMap Sydney place adapter", () => {
  it("normalises untrusted upstream list entries, discarding invalid or duplicate points", () => {
    const items = normaliseOpenTripMapPlaces([
      raw,
      { ...raw, name: "Duplicate" },
      { ...raw, xid: "W333", point: { lat: 52, lon: 10 } },
      { ...raw, xid: "not/allowed" },
      { ...raw, xid: "W999", name: "" },
      { ...raw, xid: "N567", point: { lat: -33.86, lon: 151.20 }, kinds: "historic" },
    ], retrievedAt);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      xid: "W123456",
      name: "Example Sydney Gallery",
      kinds: ["museums", "cultural", "interesting_places"],
      distanceMeters: 1250,
    });
    expect(items.every(isOpenTripMapPlace)).toBe(true);
    expect(() => normaliseOpenTripMapPlaces({ features: [] }, retrievedAt)).toThrow();
  });

  it("does not treat imported POIs as evidence of step-free access or accessible toilets", () => {
    const [place] = normaliseOpenTripMapPlaces([raw], retrievedAt);
    const original = makeSydneyDemoTrip();
    const saved = addOpenTripMapStop(original, place, 2);
    const snapshot = getTourismPlaceInTrip(saved, "otm:W123456");
    expect(snapshot?.sourceType).toBe("opentripmap");
    expect(snapshot?.stepFree.status).toBe("unknown");
    expect(snapshot?.accessibleToilet.status).toBe("unknown");
    expect(saved.days[1].stopIds).toContain("otm:W123456");
    expect(isTourismTrip(JSON.parse(JSON.stringify(saved)))).toBe(true);
    expect(addOpenTripMapStop(saved, place, 2)).toBe(saved);
    expect(moveTourismStop(saved, 2, "otm:W123456", 3).days[2].stopIds).toContain("otm:W123456");
    expect(original.externalPlaces).toEqual([]);
  });

  it("enforces a fixed Sydney radius and does not call the API while disabled", async () => {
    vi.stubEnv("OPENTRIPMAP_ENABLED", "false");
    vi.stubEnv("OPENTRIPMAP_API_KEY", "demo-secret-not-real");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(searchSydneyOpenTripMapPlaces({ query: "", kind: "museums" })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses fixed-host authenticated server fetch and returns only validated data", async () => {
    vi.stubEnv("OPENTRIPMAP_ENABLED", "true");
    vi.stubEnv("OPENTRIPMAP_API_KEY", "dummy-key");
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => [raw] }));
    vi.stubGlobal("fetch", fetchMock);
    const results = await searchSydneyOpenTripMapPlaces({ query: "gallery", kind: "museums" });
    expect(results).toHaveLength(1);
    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.hostname).toBe("api.opentripmap.com");
    expect(url.pathname).toBe("/0.1/en/places/autosuggest");
    expect(url.searchParams.get("lat")).toBe("-33.8688");
    expect(url.searchParams.get("lon")).toBe("151.2093");
    expect(url.searchParams.get("name")).toBe("gallery");
    expect(url.searchParams.get("apikey")).toBe("dummy-key");
  });
});
