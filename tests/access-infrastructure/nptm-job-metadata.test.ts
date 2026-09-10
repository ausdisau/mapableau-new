import { describe, expect, it } from "vitest";

import { buildNptmJobMetadata } from "@/lib/access/data-sources/nptm/ingestion-service";

describe("NPTM ingestion-run provenance", () => {
  it("retains source, licence and dataset fingerprints when the run summary is written", () => {
    const metadata = buildNptmJobMetadata({
      datasetContentHash: "sha256:dataset",
      retrievedAt: "2026-09-11T00:00:00.000Z",
      sourceSnapshotAt: "2026-04-01T00:00:00.000Z",
      licenceId: "CC-BY-3.0-AU",
      attributionText: "National Public Toilet Map",
      summary: {
        jobId: "job_1",
        datasetContentHash: "sha256:dataset",
        parsedRecords: 1,
        acceptedFacilities: 1,
        skippedRecords: 0,
        placeConflicts: 0,
        createdPlaces: 1,
        reusedPlaces: 0,
        observationsCreated: 4,
        duplicates: 0,
        superseded: 0,
        conflicts: 0,
        withdrawnToUnknown: 0,
        sourceSnapshotAt: "2026-04-01T00:00:00.000Z",
        productionClaim: "none",
        claimState: "in_development",
      },
    });

    expect(metadata).toMatchObject({
      dataSourceId: "national-public-toilet-map",
      datasetId: "553b3049-2b8b-46a2-95e6-640d7986a8c1",
      resourceId: "34076296-6692-4e30-b627-67b7c4eb1027",
      datasetContentHash: "sha256:dataset",
      licenceId: "CC-BY-3.0-AU",
      attributionText: "National Public Toilet Map",
      summary: expect.objectContaining({
        jobId: "job_1",
        acceptedFacilities: 1,
      }),
      productionClaim: "none",
      claimState: "in_development",
    });
  });
});
