import type { GaisRegionalDemandFeature } from "@/lib/gais/regional-demand/contracts";

export const REGIONAL_DEMAND_FIXTURES: GaisRegionalDemandFeature[] = [
  {
    id: "gais-region-sa3-10102",
    regionCode: "10102",
    regionName: "Queanbeyan",
    regionLevel: "SA3",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [149.05, -35.5],
          [149.4, -35.5],
          [149.4, -35.15],
          [149.05, -35.15],
          [149.05, -35.5],
        ],
      ],
    },
    indicators: [
      {
        key: "participantScale",
        rawValue: 1694,
        unit: "participants",
        comparisonScope: "national_sa3",
        evidence: [
          {
            sourceId: "ndia-sa3-participants-fixture",
            publisher: "NDIA",
            sourceUrl: "https://dataresearch.ndis.gov.au/",
            referencePeriod: "2026-06-30",
            retrievedAt: "2026-09-18T00:00:00.000Z",
            licenceState: "approved_public_reuse",
            confidence: "high",
            caveat:
              "Development fixture only; this endpoint does not yet claim complete national ingestion.",
          },
        ],
      },
    ],
    publicSummary: {
      evidenceCoverage: 1,
      dataAsOf: ["2026-06-30"],
    },
  },
];
