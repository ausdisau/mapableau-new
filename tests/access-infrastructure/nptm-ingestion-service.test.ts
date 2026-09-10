import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    accessImportJob: { update: vi.fn() },
    accessImportItem: { create: vi.fn(), update: vi.fn() },
    accessImportConflict: { create: vi.fn() },
    accessPlace: { findFirst: vi.fn() },
    accessPlaceSource: { create: vi.fn() },
    accessObservationRecord: { findMany: vi.fn(), update: vi.fn() },
  },
}));

vi.mock("@/lib/access/import/access-import-job-service", () => ({
  createImportJob: vi.fn(),
}));

vi.mock("@/lib/access/import/import-deduplication-service", () => ({
  findDuplicatePlaceCandidates: vi.fn(),
}));

vi.mock("@/lib/access/map/access-place-service", () => ({
  createAccessPlace: vi.fn(),
}));

vi.mock("@/lib/access/infrastructure/observation-service", () => ({
  createAccessObservation: vi.fn(),
}));

import { createAccessObservation } from "@/lib/access/infrastructure/observation-service";
import { findDuplicatePlaceCandidates } from "@/lib/access/import/import-deduplication-service";
import { createImportJob } from "@/lib/access/import/access-import-job-service";
import { createAccessPlace } from "@/lib/access/map/access-place-service";
import {
  buildNptmObservationFingerprint,
  normalizeNationalPublicToiletRecord,
} from "@/lib/access/data-sources/nptm";
import {
  NptmIngestionDisabledError,
  ingestNationalPublicToiletMapCsv,
} from "@/lib/access/data-sources/nptm/ingestion-service";
import { prisma } from "@/lib/prisma";

const MINIMAL_CSV = [
  "FacilityID,URL,Name,FacilityType,Address1,Town,State,Latitude,Longitude,Accessible,Ambulant,LHTransfer,RHTransfer,AdultChange,ChangingPlaces,MLAK24,MLAKAfterHours,AccessNote,OpeningHours,OpeningHoursNote",
  "123,https://toiletmap.gov.au/facility/123,Example Park Toilets,Park,1 Example St,Sydney,NSW,-33.8708,151.2073,TRUE,TRUE,TRUE,FALSE,TRUE,FALSE,TRUE,FALSE,MLAK key may be required,Daylight hours,Check seasonal closures",
].join("\n");

function mockObservationResult(id: string, input: Record<string, unknown>) {
  return {
    id,
    featureKey: input.featureKey,
    ontologyConceptId: input.ontologyConceptId,
    value: input.value,
    unit: null,
    sourceType: "operator",
    observedAt: "2026-04-01T00:00:00.000Z",
    evidenceKinds: input.evidenceKinds,
    confidence: input.confidence,
    disputed: input.disputed ?? false,
    placeId: "place_1",
    entityType: "amenity",
    entityId: "nptm:123",
    observerUserId: null,
    provenance: {},
    canonicalProvenance: {},
    freshness: { state: "expired", expired: true },
    productionClaim: "none",
    claimState: "in_development",
  };
}

describe("National Public Toilet Map ingestion service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MAPABLE_NPTM_INGESTION_ENABLED = "true";
    process.env.MAPABLE_ACCESS_INFRASTRUCTURE_ENABLED = "true";
    process.env.MAPABLE_ACCESS_GRAPH_ENABLED = "true";

    vi.mocked(createImportJob).mockResolvedValue({ id: "job_1" } as never);
    vi.mocked(prisma.accessImportJob.update).mockResolvedValue({} as never);
    vi.mocked(prisma.accessImportItem.create).mockResolvedValue({ id: "item_1" } as never);
    vi.mocked(prisma.accessImportItem.update).mockResolvedValue({} as never);
    vi.mocked(prisma.accessImportConflict.create).mockResolvedValue({} as never);
    vi.mocked(prisma.accessPlace.findFirst).mockResolvedValue(null);
    vi.mocked(findDuplicatePlaceCandidates).mockResolvedValue([]);
    vi.mocked(createAccessPlace).mockResolvedValue({ id: "place_1" } as never);
    vi.mocked(prisma.accessPlaceSource.create).mockResolvedValue({} as never);
    vi.mocked(prisma.accessObservationRecord.findMany).mockResolvedValue([]);
    vi.mocked(prisma.accessObservationRecord.update).mockResolvedValue({} as never);
    let observationSequence = 0;
    vi.mocked(createAccessObservation).mockImplementation(async (input) => {
      observationSequence += 1;
      return mockObservationResult(`obs_${observationSequence}`, input as never) as never;
    });
  });

  afterEach(() => {
    delete process.env.MAPABLE_NPTM_INGESTION_ENABLED;
  });

  it("fails closed unless the dedicated NPTM write flag is enabled", async () => {
    delete process.env.MAPABLE_NPTM_INGESTION_ENABLED;

    await expect(
      ingestNationalPublicToiletMapCsv({
        csv: MINIMAL_CSV,
        actorId: "admin_1",
        retrievedAt: "2026-09-11T00:00:00.000Z",
        sourceSnapshotAt: "2026-04-01T00:00:00.000Z",
      }),
    ).rejects.toBeInstanceOf(NptmIngestionDisabledError);

    expect(createImportJob).not.toHaveBeenCalled();
  });

  it("creates an ingestion run, pending-moderation place, source provenance and Access Graph observations", async () => {
    const result = await ingestNationalPublicToiletMapCsv({
      csv: MINIMAL_CSV,
      actorId: "admin_1",
      retrievedAt: "2026-09-11T00:00:00.000Z",
      sourceSnapshotAt: "2026-04-01T00:00:00.000Z",
    });

    expect(result.jobId).toBe("job_1");
    expect(result.datasetContentHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(result.createdPlaces).toBe(1);
    expect(result.observationsCreated).toBeGreaterThan(0);

    expect(createImportJob).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: "csv",
        sourceUrl: expect.stringContaining("data.gov.au"),
      }),
    );
    expect(createAccessPlace).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "pending_moderation",
        sourceType: "imported",
        sourceReference: "nptm:123",
        input: expect.objectContaining({
          category: "public_toilet",
          latitude: -33.8708,
          longitude: 151.2073,
        }),
      }),
    );
    expect(prisma.accessPlaceSource.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceType: "csv",
          externalId: "123",
          metadata: expect.objectContaining({
            dataSourceId: "national-public-toilet-map",
            licenceId: "CC-BY-3.0-AU",
            datasetContentHash: result.datasetContentHash,
          }),
        }),
      }),
    );
    expect(createAccessObservation).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: "operator",
        observedAt: "2026-04-01T00:00:00.000Z",
        placeId: "place_1",
        entityType: "amenity",
        entityId: "nptm:123",
        evidenceKinds: expect.arrayContaining([
          "government_open_data",
          "national_public_toilet_map",
          "licence:CC-BY-3.0-AU",
        ]),
      }),
    );
    expect(prisma.accessImportJob.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: "job_1" },
        data: expect.objectContaining({ status: "completed" }),
      }),
    );
  });

  it("skips an identical source observation instead of rewriting it", async () => {
    vi.mocked(prisma.accessPlace.findFirst).mockResolvedValue({ id: "place_1" } as never);

    const facility = normalizeNationalPublicToiletRecord(
      {
        FacilityID: "123",
        URL: "https://toiletmap.gov.au/facility/123",
        Name: "Example Park Toilets",
        Latitude: "-33.8708",
        Longitude: "151.2073",
        Accessible: "TRUE",
      },
      {
        retrievedAt: "2026-09-11T00:00:00.000Z",
        sourceSnapshotAt: "2026-04-01T00:00:00.000Z",
      },
    );
    const observation = facility.observations[0]!;
    const fingerprint = buildNptmObservationFingerprint({
      placeId: "place_1",
      facility,
      observation,
    });

    vi.mocked(prisma.accessObservationRecord.findMany).mockResolvedValue([
      {
        id: "existing_1",
        featureKey: observation.featureKey,
        ontologyConceptId: observation.ontologyConceptId,
        valueJson: observation.value,
        sourceType: "operator",
        evidenceKinds: [
          "national_public_toilet_map",
          `nptm_source_record:${fingerprint.sourceRecordId}`,
          `nptm_observation_hash:${fingerprint.contentHash}`,
        ],
      },
    ] as never);

    const result = await ingestNationalPublicToiletMapCsv({
      csv: "FacilityID,URL,Name,Latitude,Longitude,Accessible\n123,https://toiletmap.gov.au/facility/123,Example Park Toilets,-33.8708,151.2073,TRUE",
      actorId: "admin_1",
      retrievedAt: "2026-09-11T00:00:00.000Z",
      sourceSnapshotAt: "2026-04-01T00:00:00.000Z",
    });

    expect(result.duplicates).toBe(1);
    expect(createAccessObservation).not.toHaveBeenCalled();
    expect(prisma.accessObservationRecord.update).not.toHaveBeenCalled();
  });

  it("preserves a conflicting community assertion and marks both sides disputed", async () => {
    vi.mocked(prisma.accessPlace.findFirst).mockResolvedValue({ id: "place_1" } as never);
    vi.mocked(prisma.accessObservationRecord.findMany).mockResolvedValue([
      {
        id: "community_1",
        featureKey: "toilet.accessible",
        ontologyConceptId: "self_care_continence.accessible_toilet",
        valueJson: false,
        sourceType: "community",
        evidenceKinds: ["photo"],
      },
    ] as never);

    const result = await ingestNationalPublicToiletMapCsv({
      csv: "FacilityID,URL,Name,Latitude,Longitude,Accessible\n123,https://toiletmap.gov.au/facility/123,Example Park Toilets,-33.8708,151.2073,TRUE",
      actorId: "admin_1",
      retrievedAt: "2026-09-11T00:00:00.000Z",
      sourceSnapshotAt: "2026-04-01T00:00:00.000Z",
    });

    expect(result.conflicts).toBe(1);
    expect(createAccessObservation).toHaveBeenCalledWith(
      expect.objectContaining({ disputed: true }),
    );
    expect(prisma.accessObservationRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "community_1" },
        data: expect.objectContaining({
          disputed: true,
          verificationStatus: "disputed",
        }),
      }),
    );
  });
});
