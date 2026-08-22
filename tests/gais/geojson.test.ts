import { describe, expect, it } from "vitest";

import type { GaisFeature } from "@/lib/gais/contracts";
import {
  gaisFeatureToGeoJson,
  gaisFeaturesToFeatureCollection,
} from "@/lib/gais/geojson/converters";
import { stripPrivateFields } from "@/lib/gais/service/adapters";

describe("GAIS GeoJSON", () => {
  const sampleFeature: GaisFeature = {
    id: "gais-place-test",
    type: "ENTRANCE",
    geometry: { type: "Point", coordinates: [151.2, -33.87] },
    name: "Test entrance",
    placeId: "place_1",
    properties: { accessFeatureTag: "step_free_entry" },
    evidence: [
      {
        sourceType: "PROVIDER_OR_VENUE_DECLARED",
        sourceLabel: "Venue supplied",
        observedAt: "2026-08-14T00:00:00.000Z",
      },
    ],
    observedAt: "2026-08-14T00:00:00.000Z",
  };

  it("produces valid GeoJSON Feature", () => {
    const geo = gaisFeatureToGeoJson(sampleFeature);
    expect(geo.type).toBe("Feature");
    expect(geo.geometry.type).toBe("Point");
    expect(geo.properties.gaisEvidenceState).toBe("PROVIDER_OR_VENUE_DECLARED");
    expect(geo.properties.unknownAttributes).toContain("Step-free");
  });

  it("keeps UNKNOWN as UNKNOWN", () => {
    const unknownFeature: GaisFeature = {
      ...sampleFeature,
      evidence: [{ sourceType: "UNKNOWN" }],
    };
    const geo = gaisFeatureToGeoJson(unknownFeature);
    expect(geo.properties.gaisEvidenceState).toBe("UNKNOWN");
    expect(geo.properties.gaisEvidenceLabel).toBe("Unknown");
  });

  it("builds FeatureCollection with meta", () => {
    const fc = gaisFeaturesToFeatureCollection([sampleFeature], {
      claimState: "in_development",
      evidenceScope: "test",
    });
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features).toHaveLength(1);
    expect(fc.meta.liveNationalRouting).toBe(false);
  });

  it("strips participant identifiers from properties", () => {
    const withPrivate: GaisFeature = {
      ...sampleFeature,
      properties: {
        ...sampleFeature.properties,
        reporterUserId: "user_secret",
        participantId: "p_secret",
      } as GaisFeature["properties"],
    };
    const stripped = stripPrivateFields(withPrivate);
    expect(stripped.properties.reporterUserId).toBeUndefined();
    expect(stripped.properties.participantId).toBeUndefined();
  });
});
