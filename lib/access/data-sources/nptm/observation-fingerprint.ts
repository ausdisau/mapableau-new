import { createHash } from "node:crypto";

import type { ObservationFingerprint } from "@/lib/access/data-sources/registry";

import {
  NPTM_DATA_SOURCE_ID,
  type NptmNormalisedFacility,
  type NptmNormalisedObservation,
} from "./index";

function stableValue(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableValue).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableValue(record[key])}`)
    .join(",")}}`;
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

export function buildNptmObservationFingerprint(input: {
  placeId: string;
  facility: NptmNormalisedFacility;
  observation: NptmNormalisedObservation;
}): ObservationFingerprint {
  const sourceRecordId = `${input.facility.sourceRecordId}:${input.observation.sourceField}`;
  const valueFingerprint = stableValue(input.observation.value);

  return {
    dataSourceId: NPTM_DATA_SOURCE_ID,
    sourceRecordId,
    contentHash: sha256(
      stableValue({
        sourceRecordId,
        value: input.observation.value,
      }),
    ),
    claimKey: `place:${input.placeId}:${input.observation.ontologyConceptId}`,
    valueFingerprint,
  };
}

export function buildNptmObservationEvidenceKinds(input: {
  fingerprint: ObservationFingerprint;
  datasetContentHash: string;
  licenceId: string;
}): string[] {
  return [
    "government_open_data",
    "national_public_toilet_map",
    `nptm_source_record:${input.fingerprint.sourceRecordId}`,
    `nptm_observation_hash:${input.fingerprint.contentHash}`,
    `nptm_dataset_hash:${input.datasetContentHash}`,
    `licence:${input.licenceId}`,
  ];
}

export function extractNptmFingerprintFromEvidenceKinds(input: {
  evidenceKinds: string[];
  claimKey: string;
  value: unknown;
}): ObservationFingerprint | null {
  if (!input.evidenceKinds.includes("national_public_toilet_map")) return null;
  const sourceRecord = input.evidenceKinds.find((item) =>
    item.startsWith("nptm_source_record:"),
  );
  const contentHash = input.evidenceKinds.find((item) =>
    item.startsWith("nptm_observation_hash:"),
  );
  if (!sourceRecord || !contentHash) return null;

  return {
    dataSourceId: NPTM_DATA_SOURCE_ID,
    sourceRecordId: sourceRecord.slice("nptm_source_record:".length),
    contentHash: contentHash.slice("nptm_observation_hash:".length),
    claimKey: input.claimKey,
    valueFingerprint: stableValue(input.value),
  };
}

export function fingerprintNonNptmObservation(input: {
  id: string;
  sourceType: string;
  claimKey: string;
  value: unknown;
}): ObservationFingerprint {
  return {
    dataSourceId:
      input.sourceType === "community"
        ? "mapable-community"
        : `mapable-${input.sourceType}`,
    sourceRecordId: input.id,
    contentHash: `observation:${input.id}`,
    claimKey: input.claimKey,
    valueFingerprint: stableValue(input.value),
  };
}
