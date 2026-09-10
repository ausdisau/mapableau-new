import { createHash } from "node:crypto";

import {
  classifyObservationChange,
  getDataSource,
  validateProvenanceEnvelope,
  type ObservationChange,
  type ObservationFingerprint,
  type ProvenanceEnvelope,
} from "@/lib/access/data-sources/registry";

export const NPTM_DATA_SOURCE_ID = "national-public-toilet-map" as const;
export const NPTM_DATASET_ID = "553b3049-2b8b-46a2-95e6-640d7986a8c1" as const;
export const NPTM_RESOURCE_ID = "34076296-6692-4e30-b627-67b7c4eb1027" as const;
export const NPTM_CURRENT_RESOURCE_URL =
  "https://data.gov.au/data/dataset/553b3049-2b8b-46a2-95e6-640d7986a8c1/resource/34076296-6692-4e30-b627-67b7c4eb1027/download/toiletmapexport_260401_074429.csv" as const;
export const NPTM_CURRENT_SNAPSHOT_AT = "2026-04-01T00:00:00.000Z" as const;

export type NationalPublicToiletMapRecord = Readonly<
  Record<string, string | undefined>
>;

export type NptmNormalisedObservation = {
  featureKey: string;
  ontologyConceptId: string;
  value: string | boolean;
  unit: null;
  sourceField: string;
  confidence: number;
  limitations: string[];
};

export type NptmNormalisedFacility = {
  sourceRecordId: string;
  sourceUri: string;
  name: string;
  facilityType: string | null;
  addressText: string | null;
  location: { latitude: number; longitude: number } | null;
  observations: NptmNormalisedObservation[];
  limitations: string[];
  canonicalRecord: Record<string, string>;
  rowContentHash: string;
  retrievedAt: string;
  sourceSnapshotAt: string;
};

export type NptmProvenanceEnvelope = ProvenanceEnvelope & {
  datasetContentHash: string;
  sourceSnapshotAt: string;
  datasetId: typeof NPTM_DATASET_ID;
  resourceId: typeof NPTM_RESOURCE_ID;
};

export type NptmObservationChangePlan = {
  action: ObservationChange;
  preserveExisting: boolean;
  conflicting: ObservationFingerprint[];
};

/**
 * Fields introduced as new flags in Toilet Map v5 are positive-evidence-only.
 * The publisher's October 2021 release notes say new flags were initially set
 * FALSE and should only be relied on when TRUE until information providers had
 * supplied sufficient updates. A FALSE in these fields is therefore omitted,
 * not converted into evidence that the feature is absent.
 */
const POSITIVE_EVIDENCE_ONLY_BOOLEAN_FIELDS = new Set([
  "MLAKAfterHours",
  "BYOSling",
  "ACShower",
  "ACMLAK",
  "DPWashout",
  "DPAfterHours",
  "AllGender",
  "Accessible",
  "MensPadDisposal",
]);

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .filter((key) => record[key] !== undefined)
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function canonicalRecord(
  input: NationalPublicToiletMapRecord,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(input)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function text(
  input: NationalPublicToiletMapRecord,
  key: string,
): string | null {
  const value = input[key]?.trim();
  return value ? value : null;
}

function parseBooleanToken(value: string | null): boolean | null {
  if (!value) return null;
  const token = value.trim().toUpperCase();
  if (["TRUE", "T", "YES", "Y", "1"].includes(token)) return true;
  if (["FALSE", "F", "NO", "N", "0"].includes(token)) return false;
  return null;
}

function sourceBoolean(
  input: NationalPublicToiletMapRecord,
  field: string,
): { value: boolean | null; positiveOnlyFalse: boolean } {
  const parsed = parseBooleanToken(text(input, field));
  if (
    parsed === false &&
    POSITIVE_EVIDENCE_ONLY_BOOLEAN_FIELDS.has(field)
  ) {
    return { value: null, positiveOnlyFalse: true };
  }
  return { value: parsed, positiveOnlyFalse: false };
}

function parseCoordinate(
  raw: string | null,
  min: number,
  max: number,
): number | null {
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) return null;
  return value;
}

function buildAccessInformation(
  record: NationalPublicToiletMapRecord,
): string | null {
  const parts = [
    ["Access", text(record, "AccessNote")],
    ["Opening hours", text(record, "OpeningHoursNote")],
    ["Toilet", text(record, "ToiletNote")],
    ["Adult change", text(record, "AdultChangeNote")],
    ["Address", text(record, "AddressNote")],
  ] as const;

  const populated = parts
    .filter((item): item is readonly [string, string] => item[1] !== null)
    .map(([label, value]) => `${label}: ${value}`);

  return populated.length ? populated.join(" | ") : null;
}

function addBooleanObservation(
  target: NptmNormalisedObservation[],
  record: NationalPublicToiletMapRecord,
  input: {
    field: string;
    featureKey: string;
    ontologyConceptId: string;
  },
  facilityLimitations: string[],
): void {
  const parsed = sourceBoolean(record, input.field);
  if (parsed.positiveOnlyFalse) {
    facilityLimitations.push(
      `${input.field}=FALSE is not treated as negative evidence because the NPTM v5 release notes say newly introduced flags should only be relied on when TRUE until source providers have updated them.`,
    );
    return;
  }
  if (parsed.value === null) return;

  target.push({
    featureKey: input.featureKey,
    ontologyConceptId: input.ontologyConceptId,
    value: parsed.value,
    unit: null,
    sourceField: input.field,
    confidence: parsed.value ? 0.8 : 0.7,
    limitations: [
      "Government dataset assertion; not independently inspected by MapAble.",
    ],
  });
}

export function fingerprintNptmDataset(csv: string): string {
  return sha256(csv);
}

/**
 * RFC-4180-style CSV parser sufficient for the NPTM export: quoted commas,
 * doubled quote escapes, CRLF/LF line endings, and embedded newlines.
 */
export function parseNationalPublicToiletMapCsv(
  csv: string,
): NationalPublicToiletMapRecord[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    if (row.some((value) => value.length > 0)) rows.push(row);
    row = [];
  };

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    if (char === '"') {
      if (quoted && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (!quoted && char === ",") {
      pushField();
      continue;
    }

    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && csv[index + 1] === "\n") index += 1;
      pushRow();
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) pushRow();
  if (!rows.length) return [];

  const headers = rows[0].map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, "").trim() : header.trim(),
  );
  if (!headers.includes("FacilityID")) {
    throw new Error("NPTM_CSV_MISSING_FACILITY_ID_HEADER");
  }

  return rows.slice(1).map((values) =>
    Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    ),
  );
}

export function normalizeNationalPublicToiletRecord(
  record: NationalPublicToiletMapRecord,
  context: { retrievedAt: string; sourceSnapshotAt: string },
): NptmNormalisedFacility {
  const sourceRecordId = text(record, "FacilityID");
  if (!sourceRecordId) throw new Error("NPTM_RECORD_MISSING_FACILITY_ID");

  const name = text(record, "Name") ?? `Public toilet ${sourceRecordId}`;
  const latitude = parseCoordinate(text(record, "Latitude"), -90, 90);
  const longitude = parseCoordinate(text(record, "Longitude"), -180, 180);
  const limitations: string[] = [
    "NPTM source snapshot date is not a MapAble on-site inspection date.",
  ];

  if (latitude === null || longitude === null) {
    limitations.push("Source record has missing or invalid coordinates.");
  }

  const observations: NptmNormalisedObservation[] = [];
  addBooleanObservation(
    observations,
    record,
    {
      field: "Accessible",
      featureKey: "toilet.accessible",
      ontologyConceptId: "self_care_continence.accessible_toilet",
    },
    limitations,
  );
  addBooleanObservation(
    observations,
    record,
    {
      field: "Ambulant",
      featureKey: "toilet.ambulant",
      ontologyConceptId: "self_care_continence.ambulant_toilet",
    },
    limitations,
  );
  addBooleanObservation(
    observations,
    record,
    {
      field: "LHTransfer",
      featureKey: "toilet.transfer.left",
      ontologyConceptId: "self_care_continence.left_hand_transfer",
    },
    limitations,
  );
  addBooleanObservation(
    observations,
    record,
    {
      field: "RHTransfer",
      featureKey: "toilet.transfer.right",
      ontologyConceptId: "self_care_continence.right_hand_transfer",
    },
    limitations,
  );
  addBooleanObservation(
    observations,
    record,
    {
      field: "AdultChange",
      featureKey: "toilet.adult_change",
      ontologyConceptId: "self_care_continence.adult_change",
    },
    limitations,
  );
  addBooleanObservation(
    observations,
    record,
    {
      field: "ChangingPlaces",
      featureKey: "toilet.changing_places",
      ontologyConceptId: "self_care_continence.changing_places",
    },
    limitations,
  );
  addBooleanObservation(
    observations,
    record,
    {
      field: "MLAK24",
      featureKey: "toilet.mlak.required_24h",
      ontologyConceptId: "self_care_continence.mlak_required_24h",
    },
    limitations,
  );
  addBooleanObservation(
    observations,
    record,
    {
      field: "MLAKAfterHours",
      featureKey: "toilet.mlak.required_after_hours",
      ontologyConceptId: "self_care_continence.mlak_required_after_hours",
    },
    limitations,
  );

  const openingHours = text(record, "OpeningHours");
  if (openingHours) {
    observations.push({
      featureKey: "toilet.opening_hours",
      ontologyConceptId: "self_care_continence.opening_hours",
      value: openingHours,
      unit: null,
      sourceField: "OpeningHours",
      confidence: 0.7,
      limitations: [
        "Publisher-supplied schedule; current opening must still pass freshness checks.",
      ],
    });
  }

  const accessInformation = buildAccessInformation(record);
  if (accessInformation) {
    observations.push({
      featureKey: "toilet.access_information",
      ontologyConceptId: "self_care_continence.access_information",
      value: accessInformation,
      unit: null,
      sourceField: "AccessNote+OpeningHoursNote+ToiletNote+AdultChangeNote+AddressNote",
      confidence: 0.65,
      limitations: [
        "Free-text source information is displayed as evidence, not converted into an accessibility guarantee.",
      ],
    });
  }

  const canonical = canonicalRecord(record);
  const sourceUri =
    text(record, "URL") ??
    `https://toiletmap.gov.au/facility/${encodeURIComponent(sourceRecordId)}`;
  const addressText = [
    text(record, "Address1"),
    text(record, "Town"),
    text(record, "State"),
  ]
    .filter((value): value is string => value !== null)
    .join(", ");

  return {
    sourceRecordId,
    sourceUri,
    name,
    facilityType: text(record, "FacilityType"),
    addressText: addressText || null,
    location:
      latitude === null || longitude === null
        ? null
        : { latitude, longitude },
    observations,
    limitations: [...new Set(limitations)],
    canonicalRecord: canonical,
    rowContentHash: sha256(stableStringify(canonical)),
    retrievedAt: context.retrievedAt,
    sourceSnapshotAt: context.sourceSnapshotAt,
  };
}

export function buildNptmProvenance(input: {
  sourceRecordId: string;
  canonicalRecord: NationalPublicToiletMapRecord;
  retrievedAt: string;
  sourceSnapshotAt: string;
  datasetContentHash: string;
}): NptmProvenanceEnvelope {
  const source = getDataSource(NPTM_DATA_SOURCE_ID);
  const canonical = canonicalRecord(input.canonicalRecord);
  const recordUrl = text(canonical, "URL");

  const envelope: NptmProvenanceEnvelope = {
    dataSourceId: NPTM_DATA_SOURCE_ID,
    sourceRecordId: input.sourceRecordId,
    sourceUri:
      recordUrl ??
      `https://toiletmap.gov.au/facility/${encodeURIComponent(input.sourceRecordId)}`,
    retrievedAt: input.retrievedAt,
    observedAt: input.sourceSnapshotAt,
    contentHash: sha256(stableStringify(canonical)),
    datasetContentHash: input.datasetContentHash,
    sourceSnapshotAt: input.sourceSnapshotAt,
    datasetId: NPTM_DATASET_ID,
    resourceId: NPTM_RESOURCE_ID,
    licenceId: source.licence?.id,
    attributionText: source.licence?.attributionText,
    verificationStatus: "OBSERVED",
    confidence: 0.8,
    machineDerived: false,
  };

  validateProvenanceEnvelope(envelope);
  return envelope;
}

export function planNptmObservationChange(input: {
  existing: ObservationFingerprint[];
  incoming: ObservationFingerprint;
}): NptmObservationChangePlan {
  for (const existing of input.existing) {
    const action = classifyObservationChange({ existing, incoming: input.incoming });
    if (action === "DUPLICATE") {
      return { action, preserveExisting: true, conflicting: [] };
    }
  }

  for (const existing of input.existing) {
    const action = classifyObservationChange({ existing, incoming: input.incoming });
    if (action === "SUPERSEDE") {
      return { action, preserveExisting: true, conflicting: [existing] };
    }
  }

  const conflicting = input.existing.filter(
    (existing) =>
      classifyObservationChange({ existing, incoming: input.incoming }) ===
      "CONFLICT",
  );
  if (conflicting.length) {
    return { action: "CONFLICT", preserveExisting: true, conflicting };
  }

  return { action: "CREATE", preserveExisting: false, conflicting: [] };
}
