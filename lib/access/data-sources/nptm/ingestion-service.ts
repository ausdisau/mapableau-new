import type { Prisma } from "@prisma/client";

import {
  assertOperationalIngestionAllowed,
  classifyObservationChange,
  getDataSource,
  type ObservationFingerprint,
} from "@/lib/access/data-sources/registry";
import { createAccessObservation } from "@/lib/access/infrastructure/observation-service";
import { findDuplicatePlaceCandidates } from "@/lib/access/import/import-deduplication-service";
import { createImportJob } from "@/lib/access/import/access-import-job-service";
import { createAccessPlace } from "@/lib/access/map/access-place-service";
import { prisma } from "@/lib/prisma";

import {
  NPTM_CURRENT_RESOURCE_URL,
  NPTM_DATA_SOURCE_ID,
  NPTM_DATASET_ID,
  NPTM_RESOURCE_ID,
  buildNptmProvenance,
  fingerprintNptmDataset,
  normalizeNationalPublicToiletRecord,
  parseNationalPublicToiletMapCsv,
  type NptmNormalisedFacility,
  type NptmNormalisedObservation,
} from "./index";
import {
  buildNptmObservationEvidenceKinds,
  buildNptmObservationFingerprint,
  extractNptmFingerprintFromEvidenceKinds,
  fingerprintNonNptmObservation,
} from "./observation-fingerprint";

const MAX_NPTM_CSV_BYTES = 25 * 1024 * 1024;
const MAX_NPTM_RECORDS = 30_000;
const WITHDRAWABLE_POSITIVE_ONLY_FIELDS = ["Accessible", "MLAKAfterHours"] as const;

export class NptmIngestionDisabledError extends Error {
  constructor() {
    super(
      "National Public Toilet Map writes are disabled. MAPABLE_NPTM_INGESTION_ENABLED must be explicitly enabled for an authorised run.",
    );
    this.name = "NptmIngestionDisabledError";
  }
}

export class NptmIngestionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NptmIngestionError";
  }
}

export type NptmIngestionSummary = {
  jobId: string;
  datasetContentHash: string;
  parsedRecords: number;
  acceptedFacilities: number;
  skippedRecords: number;
  placeConflicts: number;
  createdPlaces: number;
  reusedPlaces: number;
  observationsCreated: number;
  duplicates: number;
  superseded: number;
  conflicts: number;
  withdrawnToUnknown: number;
  sourceSnapshotAt: string;
  productionClaim: "none";
  claimState: "in_development";
};

type ExistingObservationRow = {
  id: string;
  featureKey: string;
  ontologyConceptId: string;
  valueJson: Prisma.JsonValue;
  sourceType: string;
  evidenceKinds: string[];
  disputeHistory?: Prisma.JsonValue | null;
};

export function isNptmIngestionEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (
    env.MAPABLE_NPTM_INGESTION_ENABLED === "true" ||
    env.MAPABLE_NPTM_INGESTION_ENABLED === "1"
  );
}

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function validateTimestamp(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new NptmIngestionError(`${field} must be a valid ISO-compatible timestamp`);
  }
}

function sourceReference(sourceRecordId: string): string {
  return `nptm:${sourceRecordId}`;
}

function claimKey(placeId: string, ontologyConceptId: string): string {
  return `place:${placeId}:${ontologyConceptId}`;
}

function fingerprintExisting(
  row: ExistingObservationRow,
  placeId: string,
): ObservationFingerprint {
  const key = claimKey(placeId, row.ontologyConceptId);
  return (
    extractNptmFingerprintFromEvidenceKinds({
      evidenceKinds: row.evidenceKinds,
      claimKey: key,
      value: row.valueJson,
    }) ??
    fingerprintNonNptmObservation({
      id: row.id,
      sourceType: row.sourceType,
      claimKey: key,
      value: row.valueJson,
    })
  );
}

function appendHistory(
  current: Prisma.JsonValue | null | undefined,
  entry: Record<string, unknown>,
): Prisma.InputJsonValue {
  const history = Array.isArray(current) ? current : [];
  return json([...history, entry]);
}

function isFalseToken(value: string | undefined): boolean {
  if (!value) return false;
  return ["FALSE", "F", "NO", "N", "0"].includes(value.trim().toUpperCase());
}

function withdrawnPositiveOnlyFields(
  facility: NptmNormalisedFacility,
): readonly string[] {
  return WITHDRAWABLE_POSITIVE_ONLY_FIELDS.filter((field) =>
    isFalseToken(facility.canonicalRecord[field]),
  );
}

async function retireWithdrawnPositiveAssertions(input: {
  facility: NptmNormalisedFacility;
  placeId: string;
  retrievedAt: string;
}): Promise<number> {
  const withdrawnFields = withdrawnPositiveOnlyFields(input.facility);
  if (!withdrawnFields.length) return 0;

  const rows = (await prisma.accessObservationRecord.findMany({
    where: {
      placeId: input.placeId,
      sourceType: "operator",
    },
    select: {
      id: true,
      featureKey: true,
      ontologyConceptId: true,
      valueJson: true,
      sourceType: true,
      evidenceKinds: true,
      disputeHistory: true,
    },
  })) as ExistingObservationRow[];

  let retired = 0;
  for (const row of rows) {
    if (!row.evidenceKinds.includes("national_public_toilet_map")) continue;

    const sourceMarker = row.evidenceKinds.find((kind) =>
      kind.startsWith("nptm_source_record:"),
    );
    if (!sourceMarker) continue;

    const shouldRetire = withdrawnFields.some(
      (field) =>
        sourceMarker ===
        `nptm_source_record:${input.facility.sourceRecordId}:${field}`,
    );
    if (!shouldRetire) continue;

    await prisma.accessObservationRecord.update({
      where: { id: row.id },
      data: {
        verificationStatus: "outdated",
        disputeHistory: appendHistory(row.disputeHistory, {
          type: "source_positive_assertion_withdrawn_to_unknown",
          dataSourceId: NPTM_DATA_SOURCE_ID,
          sourceRecordId: input.facility.sourceRecordId,
          sourceSnapshotAt: input.facility.sourceSnapshotAt,
          recordedAt: input.retrievedAt,
          note: "Later positive-evidence-only source field is FALSE; MapAble treats this as withdrawal to unknown, not negative evidence.",
        }),
      },
    });
    retired += 1;
  }

  return retired;
}

async function markSuperseded(input: {
  rows: ExistingObservationRow[];
  newObservationId: string;
  retrievedAt: string;
}): Promise<void> {
  for (const row of input.rows) {
    await prisma.accessObservationRecord.update({
      where: { id: row.id },
      data: {
        verificationStatus: "outdated",
        disputeHistory: appendHistory(row.disputeHistory, {
          type: "source_refresh_superseded",
          supersededByObservationId: input.newObservationId,
          recordedAt: input.retrievedAt,
        }),
      },
    });
  }
}

async function markConflictingExisting(input: {
  rows: ExistingObservationRow[];
  newObservationId: string;
  ontologyConceptId: string;
  retrievedAt: string;
}): Promise<void> {
  for (const row of input.rows) {
    await prisma.accessObservationRecord.update({
      where: { id: row.id },
      data: {
        disputed: true,
        verificationStatus: "disputed",
        disputeHistory: appendHistory(row.disputeHistory, {
          type: "conflicting_evidence_preserved",
          conflictingObservationId: input.newObservationId,
          ontologyConceptId: input.ontologyConceptId,
          recordedAt: input.retrievedAt,
        }),
      },
    });
  }
}

async function persistObservation(input: {
  facility: NptmNormalisedFacility;
  observation: NptmNormalisedObservation;
  placeId: string;
  importItemId: string;
  jobId: string;
  datasetContentHash: string;
  licenceId: string;
  retrievedAt: string;
}): Promise<"CREATE" | "DUPLICATE" | "SUPERSEDE" | "CONFLICT"> {
  const incoming = buildNptmObservationFingerprint({
    placeId: input.placeId,
    facility: input.facility,
    observation: input.observation,
  });

  const existingRows = (await prisma.accessObservationRecord.findMany({
    where: {
      placeId: input.placeId,
      ontologyConceptId: input.observation.ontologyConceptId,
    },
    select: {
      id: true,
      featureKey: true,
      ontologyConceptId: true,
      valueJson: true,
      sourceType: true,
      evidenceKinds: true,
      disputeHistory: true,
    },
  })) as ExistingObservationRow[];

  const classified = existingRows.map((row) => ({
    row,
    fingerprint: fingerprintExisting(row, input.placeId),
  }));

  if (
    classified.some(
      ({ fingerprint }) =>
        classifyObservationChange({ existing: fingerprint, incoming }) ===
        "DUPLICATE",
    )
  ) {
    return "DUPLICATE";
  }

  const supersededRows = classified
    .filter(
      ({ fingerprint }) =>
        classifyObservationChange({ existing: fingerprint, incoming }) ===
        "SUPERSEDE",
    )
    .map(({ row }) => row);

  const conflictingRows = classified
    .filter(
      ({ fingerprint }) =>
        classifyObservationChange({ existing: fingerprint, incoming }) ===
        "CONFLICT",
    )
    .map(({ row }) => row);

  const created = await createAccessObservation({
    featureKey: input.observation.featureKey,
    ontologyConceptId: input.observation.ontologyConceptId,
    value: input.observation.value,
    unit: input.observation.unit,
    sourceType: "operator",
    observedAt: input.facility.sourceSnapshotAt,
    evidenceKinds: buildNptmObservationEvidenceKinds({
      fingerprint: incoming,
      datasetContentHash: input.datasetContentHash,
      licenceId: input.licenceId,
    }),
    confidence: input.observation.confidence,
    placeId: input.placeId,
    entityType: "amenity",
    entityId: sourceReference(input.facility.sourceRecordId),
    disputed: conflictingRows.length > 0,
  });

  if (supersededRows.length) {
    await markSuperseded({
      rows: supersededRows,
      newObservationId: created.id,
      retrievedAt: input.retrievedAt,
    });
  }

  if (conflictingRows.length) {
    await markConflictingExisting({
      rows: conflictingRows,
      newObservationId: created.id,
      ontologyConceptId: input.observation.ontologyConceptId,
      retrievedAt: input.retrievedAt,
    });
    await prisma.accessImportConflict.create({
      data: {
        jobId: input.jobId,
        importItemId: input.importItemId,
        existingPlaceId: input.placeId,
        resolution: `Conflicting Access Graph evidence preserved for ${input.observation.ontologyConceptId}`,
      },
    });
  }

  if (conflictingRows.length) return "CONFLICT";
  if (supersededRows.length) return "SUPERSEDE";
  return "CREATE";
}

export async function ingestNationalPublicToiletMapCsv(input: {
  csv: string;
  actorId: string;
  retrievedAt: string;
  sourceSnapshotAt: string;
}): Promise<NptmIngestionSummary> {
  if (!isNptmIngestionEnabled()) throw new NptmIngestionDisabledError();
  validateTimestamp(input.retrievedAt, "retrievedAt");
  validateTimestamp(input.sourceSnapshotAt, "sourceSnapshotAt");

  if (Buffer.byteLength(input.csv, "utf8") > MAX_NPTM_CSV_BYTES) {
    throw new NptmIngestionError(
      `NPTM CSV exceeds ${MAX_NPTM_CSV_BYTES} byte safety limit`,
    );
  }

  const source = getDataSource(NPTM_DATA_SOURCE_ID);
  assertOperationalIngestionAllowed(source);
  const licenceId = source.licence?.id;
  if (!licenceId) {
    throw new NptmIngestionError("NPTM licence metadata is missing");
  }

  const rows = parseNationalPublicToiletMapCsv(input.csv);
  if (rows.length > MAX_NPTM_RECORDS) {
    throw new NptmIngestionError(
      `NPTM CSV exceeds ${MAX_NPTM_RECORDS} record safety limit`,
    );
  }

  const datasetContentHash = fingerprintNptmDataset(input.csv);
  const job = await createImportJob({
    createdById: input.actorId,
    sourceType: "csv",
    sourceUrl: NPTM_CURRENT_RESOURCE_URL,
    fileName: "national-public-toilet-map.csv",
  });

  const summary: NptmIngestionSummary = {
    jobId: job.id,
    datasetContentHash,
    parsedRecords: rows.length,
    acceptedFacilities: 0,
    skippedRecords: 0,
    placeConflicts: 0,
    createdPlaces: 0,
    reusedPlaces: 0,
    observationsCreated: 0,
    duplicates: 0,
    superseded: 0,
    conflicts: 0,
    withdrawnToUnknown: 0,
    sourceSnapshotAt: input.sourceSnapshotAt,
    productionClaim: "none",
    claimState: "in_development",
  };

  await prisma.accessImportJob.update({
    where: { id: job.id },
    data: {
      status: "parsing",
      metadata: json({
        dataSourceId: NPTM_DATA_SOURCE_ID,
        datasetId: NPTM_DATASET_ID,
        resourceId: NPTM_RESOURCE_ID,
        datasetContentHash,
        retrievedAt: input.retrievedAt,
        sourceSnapshotAt: input.sourceSnapshotAt,
        licenceId,
        attributionText: source.licence?.attributionText ?? null,
        productionClaim: "none",
      }),
    },
  });

  try {
    for (const [index, record] of rows.entries()) {
      let facility: NptmNormalisedFacility;
      try {
        facility = normalizeNationalPublicToiletRecord(record, {
          retrievedAt: input.retrievedAt,
          sourceSnapshotAt: input.sourceSnapshotAt,
        });
      } catch (error) {
        summary.skippedRecords += 1;
        await prisma.accessImportItem.create({
          data: {
            jobId: job.id,
            name: record.Name?.trim() || `NPTM row ${index + 1}`,
            category: "public_toilet",
            externalRef: record.FacilityID?.trim() || null,
            status: "skipped",
            rawData: json({
              record,
              error: error instanceof Error ? error.message : "normalisation_failed",
            }),
          },
        });
        continue;
      }

      const provenance = buildNptmProvenance({
        sourceRecordId: facility.sourceRecordId,
        canonicalRecord: facility.canonicalRecord,
        retrievedAt: input.retrievedAt,
        sourceSnapshotAt: input.sourceSnapshotAt,
        datasetContentHash,
      });
      const ref = sourceReference(facility.sourceRecordId);

      if (!facility.location) {
        summary.skippedRecords += 1;
        await prisma.accessImportItem.create({
          data: {
            jobId: job.id,
            name: facility.name,
            description: facility.facilityType,
            category: "public_toilet",
            externalRef: ref,
            status: "skipped",
            rawData: json({
              record: facility.canonicalRecord,
              provenance,
              limitations: facility.limitations,
            }),
          },
        });
        continue;
      }

      let place = await prisma.accessPlace.findFirst({
        where: { sourceReference: ref },
        select: { id: true },
      });

      if (!place) {
        const duplicateCandidates = await findDuplicatePlaceCandidates({
          name: facility.name,
          latitude: facility.location.latitude,
          longitude: facility.location.longitude,
          sourceReference: ref,
        });
        if (duplicateCandidates.length) {
          summary.placeConflicts += 1;
          const importItem = await prisma.accessImportItem.create({
            data: {
              jobId: job.id,
              name: facility.name,
              description: facility.facilityType,
              latitude: facility.location.latitude,
              longitude: facility.location.longitude,
              category: "public_toilet",
              externalRef: ref,
              status: "conflict",
              rawData: json({
                record: facility.canonicalRecord,
                provenance,
                limitations: facility.limitations,
              }),
            },
          });
          for (const candidate of duplicateCandidates) {
            await prisma.accessImportConflict.create({
              data: {
                jobId: job.id,
                importItemId: importItem.id,
                existingPlaceId: candidate.placeId,
                resolution: candidate.reason,
              },
            });
          }
          continue;
        }

        place = await createAccessPlace({
          input: {
            name: facility.name,
            category: "public_toilet",
            description: facility.facilityType ?? undefined,
            addressText: facility.addressText ?? undefined,
            stateOrRegion: record.State?.trim() || undefined,
            country: "AU",
            latitude: facility.location.latitude,
            longitude: facility.location.longitude,
          },
          createdById: input.actorId,
          status: "pending_moderation",
          sourceType: "imported",
          sourceReference: ref,
        });
        summary.createdPlaces += 1;
      } else {
        summary.reusedPlaces += 1;
      }

      const importItem = await prisma.accessImportItem.create({
        data: {
          jobId: job.id,
          name: facility.name,
          description: facility.facilityType,
          latitude: facility.location.latitude,
          longitude: facility.location.longitude,
          category: "public_toilet",
          externalRef: ref,
          matchedPlaceId: place.id,
          status: "accepted",
          rawData: json({
            record: facility.canonicalRecord,
            provenance,
            limitations: facility.limitations,
          }),
        },
      });

      await prisma.accessPlaceSource.create({
        data: {
          placeId: place.id,
          sourceType: "csv",
          sourceUrl: facility.sourceUri,
          externalId: facility.sourceRecordId,
          metadata: json({
            dataSourceId: NPTM_DATA_SOURCE_ID,
            datasetId: NPTM_DATASET_ID,
            resourceId: NPTM_RESOURCE_ID,
            datasetContentHash,
            rowContentHash: facility.rowContentHash,
            sourceSnapshotAt: input.sourceSnapshotAt,
            retrievedAt: input.retrievedAt,
            licenceId,
            attributionText: source.licence?.attributionText ?? null,
            limitations: facility.limitations,
          }),
        },
      });

      let itemHasConflict = false;
      for (const observation of facility.observations) {
        const action = await persistObservation({
          facility,
          observation,
          placeId: place.id,
          importItemId: importItem.id,
          jobId: job.id,
          datasetContentHash,
          licenceId,
          retrievedAt: input.retrievedAt,
        });
        if (action === "DUPLICATE") {
          summary.duplicates += 1;
          continue;
        }

        summary.observationsCreated += 1;
        if (action === "SUPERSEDE") summary.superseded += 1;
        if (action === "CONFLICT") {
          summary.conflicts += 1;
          itemHasConflict = true;
        }
      }

      summary.withdrawnToUnknown += await retireWithdrawnPositiveAssertions({
        facility,
        placeId: place.id,
        retrievedAt: input.retrievedAt,
      });

      summary.acceptedFacilities += 1;
      await prisma.accessImportItem.update({
        where: { id: importItem.id },
        data: { status: itemHasConflict ? "conflict" : "accepted" },
      });
    }

    await prisma.accessImportJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        metadata: json(summary),
      },
    });
    return summary;
  } catch (error) {
    await prisma.accessImportJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "NPTM ingestion failed",
        metadata: json(summary),
      },
    });
    throw error;
  }
}
