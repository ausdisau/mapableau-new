import { describe, expect, it } from "vitest";

import type { WorkerScreeningProvider } from "@/lib/workforce/screening/provider";
import { runWorkerScreeningQuery } from "@/lib/workforce/screening/query-service";

function fakeProvider(
  status: "clearance" | "pending",
  source:
    | "state_or_territory_worker_screening_unit"
    | "provider_supplied_evidence" = "state_or_territory_worker_screening_unit",
): WorkerScreeningProvider {
  return {
    providerId: "test-provider",
    jurisdiction: "VIC",
    capabilities: ["single_status_lookup"],
    async healthCheck() {
      return {
        providerId: "test-provider",
        jurisdiction: "VIC",
        configured: true,
        liveTransportEnabled: true,
        capabilities: ["single_status_lookup"],
        notes: [],
      };
    },
    async queryStatus() {
      return [
        {
          jurisdiction: "VIC",
          status,
          source,
          checkedAt: "2026-09-04T00:00:00.000Z",
          expiresAt:
            status === "clearance" ? "2028-09-04T00:00:00.000Z" : null,
          notes: [],
        },
      ];
    },
  };
}

describe("worker screening query service", () => {
  it("accepts authoritative current clearance evidence", async () => {
    const report = await runWorkerScreeningQuery(
      {
        workerName: "Example Worker",
        screeningId: "WS-123",
        dateOfBirth: "1990-01-01",
        jurisdiction: "VIC",
      },
      { enabled: true, provider: fakeProvider("clearance") },
    );

    expect(report.assessment.status).toBe("clearance");
    expect(report.assessment.canTreatAsCleared).toBe(true);
    expect(report.querySummary.hasDateOfBirth).toBe(true);
    expect(report).not.toHaveProperty("dateOfBirth");
  });

  it("does not accept provider-supplied clearance as authoritative", async () => {
    const report = await runWorkerScreeningQuery(
      { workerName: "Example Worker", jurisdiction: "VIC" },
      {
        enabled: true,
        provider: fakeProvider("clearance", "provider_supplied_evidence"),
      },
    );

    expect(report.assessment.status).toBe("unable_to_verify");
    expect(report.assessment.canTreatAsCleared).toBe(false);
    expect(report.assessment.reasonCodes).toContain(
      "WORKER_SCREENING_AUTHORITATIVE_SOURCE_REQUIRED",
    );
  });

  it("fails closed for a jurisdiction that only has a manual pathway", async () => {
    const report = await runWorkerScreeningQuery(
      { screeningId: "WS-456", jurisdiction: "NSW" },
      { enabled: true },
    );

    expect(report.assessment.status).toBe("unable_to_verify");
    expect(report.assessment.reasonCodes).toContain(
      "WORKER_SCREENING_PATHWAY_ONLY",
    );
    expect(report.pathway?.jurisdiction).toBe("NSW");
  });

  it("returns unable-to-verify rather than guessing when disabled", async () => {
    const report = await runWorkerScreeningQuery(
      { screeningId: "WS-789", jurisdiction: "VIC" },
      { enabled: false },
    );

    expect(report.assessment.status).toBe("unable_to_verify");
    expect(report.assessment.canTreatAsCleared).toBe(false);
    expect(report.assessment.reasonCodes).toContain(
      "WORKER_SCREENING_QUERY_DISABLED",
    );
  });
});
