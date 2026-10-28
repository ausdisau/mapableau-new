import { describe, expect, it } from "vitest";

import {
  allowedPlacesOrigin,
  isPlacesPrototypeEnabled,
  normalisePlacesPreviewOrigin,
  toPublicPlacesRecord,
} from "@/lib/places/integration";

describe("MapAble Places safe integration boundaries", () => {
  it("fails closed unless explicitly enabled", () => {
    expect(isPlacesPrototypeEnabled({})).toBe(false);
    expect(isPlacesPrototypeEnabled({ MAPABLE_PLACES_PROTOTYPE_ENABLED: "false" })).toBe(false);
    expect(isPlacesPrototypeEnabled({ MAPABLE_PLACES_PROTOTYPE_ENABLED: "true" })).toBe(true);
  });

  it("only accepts origin-only HTTPS preview URLs in production", () => {
    expect(normalisePlacesPreviewOrigin("https://places-preview.example.org/", "production"))
      .toBe("https://places-preview.example.org");
    for (const url of [
      "javascript:alert(1)",
      "http://places-preview.example.org",
      "https://user:pass@places-preview.example.org",
      "https://places-preview.example.org/path",
      "https://places-preview.example.org/?token=secret",
      "https://places-preview.example.org/#fragment",
      "http://localhost:8081",
    ]) {
      expect(normalisePlacesPreviewOrigin(url, "production")).toBeNull();
    }
    expect(normalisePlacesPreviewOrigin("http://localhost:8081", "development"))
      .toBe("http://localhost:8081");
  });

  it("authorises exact same-origin requests but not lookalike origins", () => {
    const prod = { NODE_ENV: "production", MAPABLE_PLACES_EXPO_ORIGIN: "https://places.example.org" };
    expect(allowedPlacesOrigin("https://mapable.com.au", "https://mapable.com.au", prod))
      .toBe("https://mapable.com.au");
    expect(allowedPlacesOrigin("https://places.example.org", "https://mapable.com.au", prod))
      .toBe("https://places.example.org");
    expect(allowedPlacesOrigin("https://places.example.org.evil.test", "https://mapable.com.au", prod))
      .toBeNull();
    expect(allowedPlacesOrigin("null", "https://mapable.com.au", prod)).toBeNull();
    expect(allowedPlacesOrigin("http://localhost:8081", "https://mapable.com.au", prod))
      .toBeNull();
  });

  it("only allows Expo localhost development ports outside production", () => {
    const dev = { NODE_ENV: "development" };
    expect(allowedPlacesOrigin("http://localhost:8081", "http://localhost:3000", dev))
      .toBe("http://localhost:8081");
    expect(allowedPlacesOrigin("http://127.0.0.1:8081", "http://localhost:3000", dev))
      .toBe("http://127.0.0.1:8081");
    expect(allowedPlacesOrigin("http://localhost:9898", "http://localhost:3000", dev))
      .toBeNull();
  });

  it("exports only non-sensitive public directory fields without inferred access", () => {
    const input = {
      id: "sample-place",
      name: "Community Hall",
      category: "community_centre",
      suburb: "Sydney",
      confidence: "mapable_verified",
      features: ["step_free_entry", "accessible_toilet"],
      latitude: -33.8,
      longitude: 151.2,
      reviewerProfileId: "not-for-distribution",
      internalNote: "private",
    };
    expect(toPublicPlacesRecord(input)).toEqual({
      id: "sample-place",
      name: "Community Hall",
      category: "community_centre",
      suburb: "Sydney",
      source: "mapable-published-directory",
      stepFree: "unknown",
      accessibleToilet: "unknown",
    });
  });
});
