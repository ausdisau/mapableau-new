import { describe, expect, it } from "vitest";

import {
  distanceKm,
  evaluateServiceAreaContainment,
  explainServiceAreaForFinder,
  listSyntheticProviderServiceAreas,
} from "@/lib/spatial/service-areas";

describe("Provider service areas", () => {
  it("matches postcode list coverage without claiming live availability", () => {
    const [postcodeArea] = listSyntheticProviderServiceAreas();
    expect(postcodeArea?.geometrySource).toBe("postcode_list");
    const hit = evaluateServiceAreaContainment(postcodeArea!, { postcode: "2000" });
    expect(hit.covered).toBe(true);
    expect(hit.availability).toBe("unknown");
    expect(explainServiceAreaForFinder(hit)).toMatch(/Travel fees may apply/i);
    expect(explainServiceAreaForFinder(hit)).toMatch(/must not improve compatibility ranking/i);

    const miss = evaluateServiceAreaContainment(postcodeArea!, { postcode: "3000" });
    expect(miss.covered).toBe(false);
  });

  it("evaluates radius-from-outlet containment", () => {
    const areas = listSyntheticProviderServiceAreas();
    const radius = areas.find((a) => a.geometrySource === "radius_from_outlet");
    expect(radius).toBeTruthy();
    const near = evaluateServiceAreaContainment(radius!, {
      latitude: -33.87,
      longitude: 151.21,
    });
    expect(near.covered).toBe(true);
    expect(near.availability).toBe("stale");

    const far = evaluateServiceAreaContainment(radius!, {
      latitude: -37.81,
      longitude: 144.96,
    });
    expect(far.covered).toBe(false);
  });

  it("computes haversine distance sanely for Sydney–Melbourne scale", () => {
    const d = distanceKm(
      { lat: -33.8688, lng: 151.2093 },
      { lat: -37.8136, lng: 144.9631 },
    );
    expect(d).toBeGreaterThan(600);
    expect(d).toBeLessThan(900);
  });
});
