import { describe, expect, it, vi } from "vitest";

import {
  buildGtfsIndex,
  nextDeparturesFromIndex,
  searchStopsInIndex,
  stopsNearCoordInIndex,
} from "@/lib/translink/gtfs-index";

const sampleFiles = {
  stops: `stop_id,stop_name,stop_lat,stop_lon,wheelchair_boarding
1,Central Station,-27.465,153.026,1
2,Roma Street,-27.465,153.023,0`,
  routes: `route_id,route_short_name,route_long_name,route_type
R1,66,Bourbon St Express,3`,
  trips: `route_id,service_id,trip_id,trip_headsign
R1,S1,T1,City`,
  stop_times: `trip_id,arrival_time,departure_time,stop_id,stop_sequence
T1,08:00:00,08:00:00,1,1
T1,08:10:00,08:10:00,2,2`,
};

describe("Translink GTFS index", () => {
  it("builds stop and route indexes from CSV files", () => {
    const index = buildGtfsIndex(sampleFiles);
    expect(index.stops.size).toBe(2);
    expect(index.routes.size).toBe(1);
    expect(index.trips.size).toBe(1);
  });

  it("searches stops by name", () => {
    const index = buildGtfsIndex(sampleFiles);
    const results = searchStopsInIndex(index, "central");
    expect(results).toHaveLength(1);
    expect(results[0]?.stop_name).toBe("Central Station");
  });

  it("finds stops near coordinates", () => {
    const index = buildGtfsIndex(sampleFiles);
    const results = stopsNearCoordInIndex(index, -27.465, 153.026, 500, 5);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.stop_id).toBe("1");
  });

  it("returns upcoming departures for a stop", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-26T07:30:00"));

    const index = buildGtfsIndex(sampleFiles);
    const deps = nextDeparturesFromIndex(index, "1", 5);
    expect(deps.length).toBeGreaterThan(0);
    expect(deps[0]?.routeNumber).toBe("66");

    vi.useRealTimers();
  });
});
