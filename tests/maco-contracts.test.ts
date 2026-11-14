import { afterEach, describe, expect, it } from "vitest";

import { getMacoConfig } from "@/intelligence/research/maco/config";
import {
  consciousnessEvidenceSchema,
  systemIndicatorAssessmentSchema,
} from "@/intelligence/research/maco/types";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("MACO contracts", () => {
  it("preserves supporting, opposing and uncertain evidence directions", () => {
    for (const direction of ["supports", "opposes", "uncertain"] as const) {
      expect(
        consciousnessEvidenceSchema.safeParse({
          id: "e1",
          sourceId: "s1",
          indicatorIds: ["i1"],
          direction,
          publicationStatus: "peer_reviewed",
          methodSummary: "controlled experiment",
          alternativeExplanations: [],
          replicationStatus: "unknown",
          evidenceStrength: "moderate",
          assessedAt: new Date().toISOString(),
        }).success,
      ).toBe(true);
    }
  });

  it("keeps missing system evidence unknown rather than absent", () => {
    expect(
      systemIndicatorAssessmentSchema.parse({
        systemId: "mapable-companion",
        systemVersion: "test",
        indicatorId: "i1",
        architectureEvidenceIds: [],
        experimentEvidenceIds: [],
        observedStatus: "unknown",
        mimicryRisk: "unknown",
        confidence: "low",
        limitations: ["No implementation evidence supplied"],
      }).observedStatus,
    ).toBe("unknown");
  });

  it("fails closed by default", () => {
    delete process.env.MAPABLE_MACO_ENABLED;
    expect(getMacoConfig().enabled).toBe(false);
  });
});
