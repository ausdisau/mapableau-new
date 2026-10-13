import { describe, expect, it } from "vitest";

import {
  assertNoPeopleScoring,
  computeCommunityGraphMetrics,
} from "@/lib/access/community-graph/metrics";

describe("community graph no people score", () => {
  it("computes aggregate metrics only", () => {
    const metrics = computeCommunityGraphMetrics(
      {
        totalSegments: 100,
        segmentsWithEvidence: 40,
        segmentsWithRecentEvidence: 20,
        staleEvidenceSegments: 10,
        barrierObservationCount: 5,
        unknownAttributeSegments: 30,
        recentObservationWindowDays: 90,
      },
      10,
    );
    expect(metrics.evidenceCoverageRatio).toBe(0.4);
    expect(metrics.methodology).toMatch(/No individual contributor scores/i);
    assertNoPeopleScoring(metrics);
  });

  it("rejects people scoring fields", () => {
    expect(() =>
      assertNoPeopleScoring({ contributorScore: 99 }),
    ).toThrow(/People scoring/);
  });
});
