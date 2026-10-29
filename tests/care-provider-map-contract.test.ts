import { describe, expect, it } from "vitest";

import {
  isPlausibleAustralianCoordinate,
  isValidCareMapBounds,
  safeCareProviderWebsite,
  toCareMapProvider,
  type CareMapDirectoryRow,
} from "@/lib/provider/care-map-contract";

const example: CareMapDirectoryRow = {
  sourceId: "official-outlet-1",
  providerName: "Example directory outlet",
  suburb: "Sydney",
  state: "NSW",
  postcode: "2000",
  latitude: -33.8688,
  longitude: 151.2093,
  abn: "12345678901",
  phone: null,
  website: "example.org",
  registrationGroups: ["Daily Personal Activities"],
  sourceUpdatedAt: new Date("2026-10-12T00:00:00.000Z"),
  updatedAt: new Date("2026-10-29T00:00:00.000Z"),
};

describe("Care provider map contract", () => {
  it("accepts finite ordered map bounds only", () => {
    expect(
      isValidCareMapBounds({
        south: -34.1,
        north: -33.6,
        west: 150.9,
        east: 151.4,
      }),
    ).toBe(true);
    expect(
      isValidCareMapBounds({
        south: -33.6,
        north: -34.1,
        west: 150.9,
        east: 151.4,
      }),
    ).toBe(false);
    expect(
      isValidCareMapBounds({
        south: NaN,
        north: -33.6,
        west: 150.9,
        east: 151.4,
      }),
    ).toBe(false);
  });

  it("never maps null, zero or implausible imported coordinates", () => {
    expect(isPlausibleAustralianCoordinate(-33.8688, 151.2093)).toBe(true);
    expect(isPlausibleAustralianCoordinate(0, 0)).toBe(false);
    expect(toCareMapProvider({ ...example, latitude: null })).toBeNull();
    expect(
      toCareMapProvider({ ...example, longitude: 0 }),
    ).toBeNull();
  });

  it("keeps official directory category and provenance without inventing worker status", () => {
    const mapped = toCareMapProvider(example);
    expect(mapped?.registrationGroups).toEqual(["Daily Personal Activities"]);
    expect(mapped?.sourceUpdatedAt).toBe("2026-10-12T00:00:00.000Z");
    expect(mapped?.website).toBe("https://example.org/");
    expect(mapped).not.toHaveProperty("workerScreeningStatus");
    expect(mapped).not.toHaveProperty("qualityScore");
    expect(mapped).not.toHaveProperty("availability");
    expect(mapped).not.toHaveProperty("verified");
  });

  it("rejects script URLs and credentialed URL links", () => {
    expect(safeCareProviderWebsite("javascript:alert(1)")).toBeNull();
    expect(
      safeCareProviderWebsite("https://user:pass@example.org"),
    ).toBeNull();
  });
});
