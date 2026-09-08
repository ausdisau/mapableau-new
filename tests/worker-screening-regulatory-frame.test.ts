import { afterEach, describe, expect, it } from "vitest";

import {
  assessWorkerScreening,
  workerScreeningQuerySchema,
} from "@mapable/domain-workforce";
import { getWorkerScreeningProvider } from "@/lib/workforce/screening/registry";
import { WorkerScreeningProviderNotConfiguredError } from "@/lib/workforce/screening/provider";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("worker screening regulatory frame", () => {
  it("accepts sparse queries but requires at least one worker or employer identifier", () => {
    expect(workerScreeningQuerySchema.parse({ workerName: "Jane Smith", jurisdiction: "NSW" }))
      .toMatchObject({ workerName: "Jane Smith", jurisdiction: "NSW" });

    expect(() => workerScreeningQuerySchema.parse({ jurisdiction: "NSW" })).toThrow();
  });

  it("fails closed when screening evidence is absent", () => {
    expect(assessWorkerScreening({ evidence: [] })).toEqual({
      status: "unable_to_verify",
      canTreatAsCleared: false,
      requiresHumanReview: true,
      reasonCodes: ["WORKER_SCREENING_EVIDENCE_MISSING"],
      evidence: [],
    });
  });

  it("does not treat provider-supplied clearance evidence as authoritative", () => {
    const result = assessWorkerScreening({
      evidence: [
        {
          jurisdiction: "VIC",
          status: "clearance",
          source: "provider_supplied_evidence",
          checkedAt: "2026-09-03T00:00:00.000Z",
          notes: [],
        },
      ],
    });

    expect(result.canTreatAsCleared).toBe(false);
    expect(result.status).toBe("unable_to_verify");
    expect(result.reasonCodes).toContain("WORKER_SCREENING_AUTHORITATIVE_SOURCE_REQUIRED");
  });

  it("accepts a current clearance from an authoritative state screening source", () => {
    const result = assessWorkerScreening({
      evidence: [
        {
          jurisdiction: "VIC",
          status: "clearance",
          source: "state_or_territory_worker_screening_unit",
          checkedAt: "2026-09-03T00:00:00.000Z",
          expiresAt: "2027-09-03T00:00:00.000Z",
          notes: [],
        },
      ],
      now: new Date("2026-09-04T00:00:00.000Z"),
    });

    expect(result.canTreatAsCleared).toBe(true);
    expect(result.status).toBe("clearance");
    expect(result.requiresHumanReview).toBe(false);
  });

  it("fails closed for interim bars, exclusions, suspension, pending and no-valid-clearance states", () => {
    for (const status of [
      "pending",
      "interim_bar",
      "exclusion",
      "suspension",
      "no_valid_clearance",
    ] as const) {
      const result = assessWorkerScreening({
        evidence: [
          {
            jurisdiction: "VIC",
            status,
            source: "state_or_territory_worker_screening_unit",
            checkedAt: "2026-09-03T00:00:00.000Z",
            notes: [],
          },
        ],
      });
      expect(result.canTreatAsCleared).toBe(false);
      expect(result.status).toBe(status);
    }
  });

  it("seeds Victoria without enabling live transport", async () => {
    process.env.MAPABLE_WORKER_SCREENING_QUERY_ENABLED = "true";
    process.env.MAPABLE_WORKER_SCREENING_VIC_ENABLED = "true";
    process.env.WORKER_SCREENING_VIC_BASE_URL = "https://example.invalid";
    process.env.WORKER_SCREENING_VIC_API_KEY = "test-only";

    const provider = getWorkerScreeningProvider("VIC");
    expect(provider).toBeDefined();

    const health = await provider!.healthCheck();
    expect(health.configured).toBe(true);
    expect(health.liveTransportEnabled).toBe(false);

    await expect(
      provider!.queryStatus({ workerName: "Jane Smith", jurisdiction: "VIC" }),
    ).rejects.toBeInstanceOf(WorkerScreeningProviderNotConfiguredError);
  });
});
