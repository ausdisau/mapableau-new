import { afterEach, describe, expect, it } from "vitest";

import {
  importGtfsScheduleFixture,
  mapWheelchairBoarding,
  rejectPathTraversal,
  rejectZipBomb,
  registerSource,
  resetInteropStore,
  sanitizeGtfsText,
} from "@/lib/aura/interoperability";

afterEach(() => resetInteropStore());

describe("Wave 7 — GTFS schedule", () => {
  it("imports wheelchair accessible and unknown correctly", () => {
    const source = registerSource({
      type: "gtfs_schedule",
      name: "Demo feed",
      trustState: "approved",
      freshnessPolicyId: "fp1",
      enabled: true,
      attribution: "Demo Agency",
      standardName: "GTFS",
      standardVersion: "2.0",
    });
    const result = importGtfsScheduleFixture({
      sourceId: source.id,
      stops: [
        { stopId: "s1", stopName: "Central", wheelchairBoarding: 1 },
        { stopId: "s2", stopName: "Harbour", wheelchairBoarding: undefined },
      ],
      pathways: [
        {
          pathwayId: "p1",
          fromStopId: "s1",
          toStopId: "s2",
          pathwayMode: 1,
          isBidirectional: 1,
        },
      ],
      attribution: "Demo Agency",
      feedVersion: "2026-07-01",
    });
    expect(result.stopCount).toBe(2);
    expect(mapWheelchairBoarding(1)).toBe("accessible");
    expect(mapWheelchairBoarding(undefined)).toBe("unknown");
  });

  it("quarantines broken foreign reference", () => {
    const source = registerSource({
      type: "gtfs_schedule",
      name: "Bad feed",
      trustState: "approved",
      freshnessPolicyId: "fp1",
      enabled: true,
    });
    const result = importGtfsScheduleFixture({
      sourceId: source.id,
      stops: [{ stopId: "s1", stopName: "A" }],
      pathways: [
        {
          pathwayId: "p-bad",
          fromStopId: "missing",
          toStopId: "s1",
          pathwayMode: 1,
          isBidirectional: 1,
        },
      ],
    });
    expect(result.quarantined.length).toBeGreaterThan(0);
  });

  it("rejects zip bomb and path traversal", () => {
    expect(() => rejectZipBomb(1000, 200000)).toThrow("AURA_GTFS_ZIP_BOMB");
    expect(() => rejectPathTraversal("../etc/passwd")).toThrow("AURA_GTFS_PATH_TRAVERSAL");
  });

  it("sanitizes formula injection in CSV text", () => {
    expect(sanitizeGtfsText("=cmd")).toMatch(/^'/);
  });
});
