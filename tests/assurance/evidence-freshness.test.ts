import { describe, expect, it } from "vitest";

import { classificationRank } from "@/lib/assurance/evidence/evidence-classification";
import { evaluateControlEvidence } from "@/lib/assurance/testing/evidence-evaluator";
import { evaluateEvidenceFreshness } from "@/lib/assurance/testing/evidence-freshness";

describe("evidence freshness", () => {
  it("marks stale evidence as not fresh", () => {
    const result = evaluateEvidenceFreshness({
      collectedAt: new Date("2026-01-01T00:00:00Z"),
      freshnessDays: 30,
      now: new Date("2026-07-01T00:00:00Z"),
    });
    expect(result.fresh).toBe(false);
    expect(result.reason).toBe("evidence_stale");
  });

  it("marks expired evidence as not fresh", () => {
    const result = evaluateEvidenceFreshness({
      collectedAt: new Date("2026-06-01T00:00:00Z"),
      expiresAt: new Date("2026-06-15T00:00:00Z"),
      freshnessDays: 90,
      now: new Date("2026-07-01T00:00:00Z"),
    });
    expect(result.fresh).toBe(false);
    expect(result.reason).toBe("evidence_expired");
  });
});

describe("evidence classification", () => {
  it("ranks restricted above internal", () => {
    expect(classificationRank("restricted")).toBeGreaterThan(
      classificationRank("internal")
    );
  });

  it("fails evaluation when classification too low", () => {
    const result = evaluateControlEvidence({
      evidence: [
        {
          id: "e1",
          isCurrent: true,
          collectedAt: new Date(),
          classification: "public",
          checksumSha256: "abc",
        },
      ],
      freshnessDays: 90,
      minimumClassification: "confidential",
      requireChecksum: true,
    });
    expect(result.acceptable).toBe(false);
    expect(result.result).toBe("fail");
  });
});
