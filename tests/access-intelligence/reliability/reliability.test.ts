import { describe, expect, it } from "vitest";

import {
  buildReverificationTasks,
  DEFAULT_FRESHNESS_POLICIES,
  scanEvidenceReliability,
} from "@/lib/access-intelligence/reliability";
import type { AccessFeature, Evidence } from "@/lib/access-intelligence/schemas";

describe("System 1 reliability", () => {
  const features: AccessFeature[] = [
    {
      id: "f-lift",
      placeId: "place-1",
      elementId: "e1",
      featureType: "lift",
      value: true,
      sourceType: "system_feed",
      observedAt: "2020-01-01T00:00:00.000Z",
      evidenceIds: [],
      confidence: 0.5,
      disputed: false,
    },
    {
      id: "f-door-a",
      placeId: "place-1",
      elementId: "e1",
      featureType: "clear_door_width_mm",
      value: 900,
      sourceType: "qualified_assessor",
      observedAt: "2026-01-01T00:00:00.000Z",
      evidenceIds: ["ev1"],
      confidence: 0.9,
      disputed: false,
    },
    {
      id: "f-door-b",
      placeId: "place-1",
      elementId: "e1",
      featureType: "clear_door_width_mm",
      value: 700,
      sourceType: "community_report",
      observedAt: "2026-02-01T00:00:00.000Z",
      evidenceIds: ["ev2"],
      confidence: 0.4,
      disputed: false,
    },
  ];

  const evidence: Evidence[] = [
    {
      id: "ev1",
      type: "measurement",
      title: "Door",
      capturedAt: "2026-01-01T00:00:00.000Z",
      sourceName: "Assessor",
      sourceType: "qualified_assessor",
      status: "verified",
    },
    {
      id: "ev-orphan",
      type: "photograph",
      title: "Orphan",
      capturedAt: "2026-01-01T00:00:00.000Z",
      sourceName: "Mapper",
      sourceType: "community_report",
      status: "provisional",
    },
  ];

  it("exposes freshness policy examples", () => {
    expect(DEFAULT_FRESHNESS_POLICIES.some((p) => p.featureType === "lift")).toBe(
      true,
    );
  });

  it("flags expired evidence as unknown-path findings and conflicts", () => {
    const result = scanEvidenceReliability({
      accessPlaceId: "place-1",
      features,
      evidence,
      now: new Date("2026-07-01T00:00:00.000Z"),
    });
    expect(result.expiredFeatureTypes).toContain("lift");
    expect(result.findings.some((f) => f.findingType === "claim_conflict")).toBe(
      true,
    );
    expect(result.findings.some((f) => f.findingType === "missing_provenance")).toBe(
      true,
    );
    expect(result.findings.some((f) => f.findingType === "orphaned_evidence")).toBe(
      true,
    );
    expect(result.healthScore).toBeLessThan(1);
    const tasks = buildReverificationTasks({
      accessPlaceId: "place-1",
      findings: result.findings,
    });
    expect(tasks.length).toBeGreaterThan(0);
  });
});
