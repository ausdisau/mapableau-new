import { describe, expect, it } from "vitest";

import { isClientGaisRegionalDemandLayerEnabled } from "@/lib/gais/client/flags";
import type { GaisRegionalDemandFeature } from "@/lib/gais/regional-demand/contracts";
import {
  toPublicRegionalDemandFeature,
  toPublicRegionalDemandFeatureCollection,
} from "@/lib/gais/regional-demand/public-serializer";

function feature(
  licenceState: "approved_public_reuse" | "permission_required" | "unknown",
): GaisRegionalDemandFeature {
  return {
    id: "region-SA3-10102",
    regionCode: "10102",
    regionName: "Queanbeyan",
    regionLevel: "SA3",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [149.1, -35.4],
          [149.3, -35.4],
          [149.3, -35.2],
          [149.1, -35.4],
        ],
      ],
    },
    indicators: [
      {
        key: "participantScale",
        rawValue: 1694,
        unit: "participants",
        normalizedValue: 0.6,
        comparisonScope: "national_sa3",
        evidence: [
          {
            sourceId: "ndia-sa3-participants",
            publisher: "NDIA",
            sourceUrl: "https://dataresearch.ndis.gov.au/",
            referencePeriod: "2026-06-30",
            retrievedAt: "2026-09-18T00:00:00.000Z",
            licenceState,
            confidence: "high",
          },
        ],
      },
    ],
    publicSummary: {
      evidenceCoverage: 1,
      dataAsOf: ["2026-06-30"],
    },
    internalStrategy: {
      strategyScore: 0.73,
      scoreAvailability: "available",
      weightCoverage: 0.9,
      weightsVersion: "v1",
    },
  };
}

describe("GAIS regional demand client gate", () => {
  it("defaults off", () => {
    expect(
      isClientGaisRegionalDemandLayerEnabled({
        NEXT_PUBLIC_MAPABLE_GAIS_ENABLED: "true",
        NEXT_PUBLIC_MAPABLE_GAIS_REGIONAL_DEMAND_LAYER: undefined,
      }),
    ).toBe(false);
  });
});

describe("regional demand public serialization", () => {
  it("strips internal strategy fields", () => {
    const publicFeature = toPublicRegionalDemandFeature(
      feature("approved_public_reuse"),
    );

    expect(publicFeature).not.toBeNull();
    expect(publicFeature && "internalStrategy" in publicFeature.properties).toBe(
      false,
    );
  });

  it("excludes features whose evidence is not approved for public reuse", () => {
    expect(
      toPublicRegionalDemandFeature(feature("permission_required")),
    ).toBeNull();
    expect(toPublicRegionalDemandFeature(feature("unknown"))).toBeNull();
  });

  it("states that public output does not expose the strategy score", () => {
    const collection = toPublicRegionalDemandFeatureCollection([
      feature("approved_public_reuse"),
    ]);

    expect(collection.meta.internalStrategyScoreExposed).toBe(false);
    expect(collection.meta.evidenceScope).toBe(
      "regional_demand_public_context",
    );
  });
});
