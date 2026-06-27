import { describe, expect, it, vi } from "vitest";

import { mergeGtfsIndexes, buildGtfsIndex } from "@/lib/gtfs/index";

const sampleStop = {
  stops: `stop_id,stop_name,stop_lat,stop_lon,wheelchair_boarding
1,Stop A,-12.46,130.84,1`,
  routes: `route_id,route_short_name,route_long_name,route_type
R1,1,Route One,3`,
  trips: `route_id,service_id,trip_id,trip_headsign
R1,S1,T1,City`,
  stop_times: `trip_id,arrival_time,departure_time,stop_id,stop_sequence
T1,08:00:00,08:00:00,1,1`,
};

describe("GTFS index merge", () => {
  it("merges multiple GTFS indexes for dual-feed jurisdictions", () => {
    const darwin = buildGtfsIndex(sampleStop);
    const alice = buildGtfsIndex({
      ...sampleStop,
      stops: `stop_id,stop_name,stop_lat,stop_lon,wheelchair_boarding
2,Stop B,-23.70,133.88,0`,
    });
    const merged = mergeGtfsIndexes([darwin, alice]);
    expect(merged.stops.size).toBe(2);
    expect(merged.stops.has("1")).toBe(true);
    expect(merged.stops.has("2")).toBe(true);
  });
});

describe("GTFS auth helper", () => {
  it("builds basic auth header with empty username for ACT-style keys", async () => {
    const { basicAuthHeader } = await import("@/lib/gtfs/auth");
    const header = basicAuthHeader("", "test-key");
    expect(header.Authorization).toBe(`Basic ${Buffer.from(":test-key").toString("base64")}`);
  });
});
