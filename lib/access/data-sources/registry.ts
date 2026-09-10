export const MAPABLE_DATA_CLASSES = [
  "OPEN_EVIDENCE",
  "CONTROLLED_RESEARCH",
  "PARTICIPANT_CONTROLLED",
] as const;
export type MapAbleDataClass = (typeof MAPABLE_DATA_CLASSES)[number];

export const DATA_ACCESS_MODES = [
  "OPEN",
  "CONTROLLED_RESEARCH_ENVIRONMENT",
  "PARTICIPANT_CONSENT",
] as const;
export type DataAccessMode = (typeof DATA_ACCESS_MODES)[number];

export type DataSourceLicence = {
  id: string;
  uri?: string;
  attributionText?: string;
  attributionRequired: boolean;
};

export type MapAbleDataSource = {
  id: string;
  label: string;
  steward: string;
  sourceUri: string | null;
  dataClass: MapAbleDataClass;
  accessMode: DataAccessMode;
  operationalImport: boolean;
  requiresDatasetLevelLicence: boolean;
  licence: DataSourceLicence | null;
  allowedUses: readonly string[];
  prohibitedUses: readonly string[];
};

export type IngestionAdmission = {
  allowed: boolean;
  reason: string;
};

export const PROVENANCE_VERIFICATION_STATUSES = [
  "UNVERIFIED",
  "OBSERVED",
  "CORROBORATED",
  "INDEPENDENTLY_VERIFIED",
  "DISPUTED",
  "STALE",
] as const;
export type ProvenanceVerificationStatus =
  (typeof PROVENANCE_VERIFICATION_STATUSES)[number];

export type ProvenanceEnvelope = {
  dataSourceId: string;
  sourceRecordId: string;
  sourceUri: string;
  retrievedAt: string;
  observedAt?: string;
  contentHash: string;
  licenceId?: string;
  attributionText?: string;
  verificationStatus: ProvenanceVerificationStatus;
  confidence?: number | null;
  machineDerived: boolean;
};

export type ObservationFingerprint = {
  dataSourceId: string;
  sourceRecordId: string;
  contentHash: string;
  claimKey: string;
  valueFingerprint: string;
};

export type ObservationChange =
  | "CREATE"
  | "DUPLICATE"
  | "SUPERSEDE"
  | "CONFLICT";

/**
 * Governance registry for source classes used by the Accessibility Data Fabric.
 *
 * A portal entry whose child datasets have independent reuse terms stays
 * `operationalImport: false` until an adapter registers the exact dataset-level
 * licence. Controlled research assets are never operational ingest sources.
 */
const DATA_SOURCES = [
  {
    id: "ahrc-disability-rights-statistics",
    label: "AHRC disability rights statistics",
    steward: "Australian Human Rights Commission",
    sourceUri:
      "https://humanrights.gov.au/human-rights-education/stats-and-facts-about-discrimination/statistics-about-disability-rights-0",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: true,
    requiresDatasetLevelLicence: false,
    licence: {
      id: "CC-BY-4.0",
      uri: "https://creativecommons.org/licenses/by/4.0/",
      attributionText: "Australian Human Rights Commission",
      attributionRequired: true,
    },
    allowedUses: ["aggregate_rights_indicators", "rights_taxonomy"],
    prohibitedUses: ["individual_complaint_mapping", "legal_breach_determination"],
  },
  {
    id: "ahrc-dda-action-plan-register",
    label: "AHRC DDA Action Plan Register",
    steward: "Australian Human Rights Commission",
    sourceUri:
      "https://humanrights.gov.au/resource-hub/by-resource-type/publications/guidelines/action-plans-and-guides/register-disability-discrimination-act-action-plans",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: true,
    requiresDatasetLevelLicence: false,
    licence: {
      id: "CC-BY-4.0",
      uri: "https://creativecommons.org/licenses/by/4.0/",
      attributionText: "Australian Human Rights Commission",
      attributionRequired: true,
    },
    allowedUses: ["organisation_accessibility_commitment_metadata"],
    prohibitedUses: ["ahrc_endorsement_claim", "accessibility_certification_claim"],
  },
  {
    id: "aihw-ads-outcomes-framework",
    label: "Australia's Disability Strategy Outcomes Framework",
    steward: "Australian Institute of Health and Welfare",
    sourceUri: "https://www.aihw.gov.au/australias-disability-strategy",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["aggregate_outcome_indicators"],
    prohibitedUses: ["individual_outcome_prediction"],
  },
  {
    id: "abs-plida",
    label: "Person Level Integrated Data Asset (PLIDA)",
    steward: "Australian Bureau of Statistics",
    sourceUri:
      "https://www.abs.gov.au/statistics/microdata-tablebuilder/available-microdata-tablebuilder/person-level-integrated-data-asset-plida",
    dataClass: "CONTROLLED_RESEARCH",
    accessMode: "CONTROLLED_RESEARCH_ENVIRONMENT",
    operationalImport: false,
    requiresDatasetLevelLicence: false,
    licence: null,
    allowedUses: ["approved_research", "disclosure_cleared_aggregate_findings"],
    prohibitedUses: [
      "microdata_export_to_mapable",
      "individual_eligibility_scoring",
      "reidentification",
    ],
  },
  {
    id: "aihw-national-health-data-hub",
    label: "National Health Data Hub",
    steward: "Australian Institute of Health and Welfare",
    sourceUri: "https://www.aihw.gov.au/reports-data/nhdh",
    dataClass: "CONTROLLED_RESEARCH",
    accessMode: "CONTROLLED_RESEARCH_ENVIRONMENT",
    operationalImport: false,
    requiresDatasetLevelLicence: false,
    licence: null,
    allowedUses: ["approved_research", "disclosure_cleared_aggregate_findings"],
    prohibitedUses: [
      "microdata_export_to_mapable",
      "individual_clinical_prediction",
      "reidentification",
    ],
  },
  {
    id: "ndis-public-data",
    label: "NDIS public datasets",
    steward: "National Disability Insurance Agency",
    sourceUri: "https://dataresearch.ndis.gov.au/datasets",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["aggregate_market_analysis", "provider_market_context"],
    prohibitedUses: ["participant_identification", "worker_clearance_inference"],
  },
  {
    id: "transport-for-nsw-open-data",
    label: "Transport for NSW Open Data",
    steward: "Transport for NSW",
    sourceUri: "https://opendata.transport.nsw.gov.au/",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["transport_accessibility_evidence", "routing_context"],
    prohibitedUses: ["accessibility_guarantee_without_current_evidence"],
  },
  {
    id: "national-public-toilet-map",
    label: "National Public Toilet Map",
    steward: "Australian Government",
    sourceUri: "https://data.gov.au/data/dataset/national-public-toilet-map",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: true,
    requiresDatasetLevelLicence: false,
    licence: {
      id: "CC-BY-3.0-AU",
      uri: "https://creativecommons.org/licenses/by/3.0/au/",
      attributionText: "National Public Toilet Map",
      attributionRequired: true,
    },
    allowedUses: ["accessible_toilet_features", "amenity_discovery"],
    prohibitedUses: ["current_accessibility_guarantee_without_freshness_check"],
  },
  {
    id: "openstreetmap",
    label: "OpenStreetMap",
    steward: "OpenStreetMap contributors",
    sourceUri: "https://www.openstreetmap.org/",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: true,
    requiresDatasetLevelLicence: false,
    licence: {
      id: "ODbL-1.0",
      uri: "https://opendatacommons.org/licenses/odbl/1-0/",
      attributionText: "© OpenStreetMap contributors",
      attributionRequired: true,
    },
    allowedUses: ["base_geography", "accessibility_observations"],
    prohibitedUses: ["licence_attribution_removal", "silent_verified_accessibility_claim"],
  },
] as const satisfies readonly MapAbleDataSource[];

const dataSourceById = new Map<string, MapAbleDataSource>(
  DATA_SOURCES.map((source) => [source.id, source]),
);

export function listDataSources(): readonly MapAbleDataSource[] {
  return DATA_SOURCES;
}

export function getDataSource(id: string): MapAbleDataSource {
  const source = dataSourceById.get(id);
  if (!source) throw new Error(`Unknown MapAble data source: ${id}`);
  return source;
}

export function evaluateOperationalIngestion(
  source: MapAbleDataSource,
): IngestionAdmission {
  if (source.dataClass === "CONTROLLED_RESEARCH") {
    return {
      allowed: false,
      reason:
        "Controlled research microdata must remain inside its approved research environment; only disclosure-cleared aggregate findings may cross the research firewall.",
    };
  }

  if (source.dataClass === "PARTICIPANT_CONTROLLED") {
    return {
      allowed: false,
      reason:
        "Participant-controlled data is purpose-bound personal information and must not enter the bulk external dataset ingestion pipeline.",
    };
  }

  if (source.requiresDatasetLevelLicence) {
    return {
      allowed: false,
      reason:
        "Dataset-level licence or terms must be recorded before operational ingestion is enabled for this source.",
    };
  }

  if (!source.operationalImport) {
    return {
      allowed: false,
      reason: "This source is not admitted for operational ingestion.",
    };
  }

  if (!source.licence?.id) {
    return {
      allowed: false,
      reason: "Operational ingestion requires recorded licence or reuse terms.",
    };
  }

  if (
    source.licence.attributionRequired &&
    !source.licence.attributionText?.trim()
  ) {
    return {
      allowed: false,
      reason: "Required source attribution metadata is missing.",
    };
  }

  return {
    allowed: true,
    reason: "Source is admitted for operational ingestion with recorded reuse metadata.",
  };
}

export function assertOperationalIngestionAllowed(
  source: MapAbleDataSource,
): void {
  const decision = evaluateOperationalIngestion(source);
  if (!decision.allowed) throw new Error(decision.reason);
}

export function validateProvenanceEnvelope(
  input: ProvenanceEnvelope,
): ProvenanceEnvelope {
  for (const [field, value] of [
    ["dataSourceId", input.dataSourceId],
    ["sourceRecordId", input.sourceRecordId],
    ["sourceUri", input.sourceUri],
    ["retrievedAt", input.retrievedAt],
    ["contentHash", input.contentHash],
  ] as const) {
    if (!value.trim()) throw new Error(`${field} is required`);
  }

  let parsedSource: URL;
  try {
    parsedSource = new URL(input.sourceUri);
  } catch {
    throw new Error("sourceUri must be an absolute URL");
  }
  if (parsedSource.protocol !== "https:" && parsedSource.protocol !== "http:") {
    throw new Error("sourceUri must use http or https");
  }

  if (Number.isNaN(Date.parse(input.retrievedAt))) {
    throw new Error("retrievedAt must be a valid ISO-compatible date");
  }
  if (input.observedAt && Number.isNaN(Date.parse(input.observedAt))) {
    throw new Error("observedAt must be a valid ISO-compatible date");
  }
  if (!input.contentHash.startsWith("sha256:")) {
    throw new Error("contentHash must use the sha256: prefix");
  }
  if (
    input.confidence != null &&
    (input.confidence < 0 || input.confidence > 1)
  ) {
    throw new Error("confidence must be between 0 and 1");
  }
  if (
    input.machineDerived &&
    input.verificationStatus === "INDEPENDENTLY_VERIFIED"
  ) {
    throw new Error(
      "Machine-derived evidence cannot mark itself independently verified",
    );
  }

  return { ...input };
}

export function classifyObservationChange(input: {
  existing?: ObservationFingerprint | null;
  incoming: ObservationFingerprint;
}): ObservationChange {
  const { existing, incoming } = input;
  if (!existing) return "CREATE";

  const sameSourceRecord =
    existing.dataSourceId === incoming.dataSourceId &&
    existing.sourceRecordId === incoming.sourceRecordId;

  if (sameSourceRecord) {
    return existing.contentHash === incoming.contentHash
      ? "DUPLICATE"
      : "SUPERSEDE";
  }

  if (
    existing.claimKey === incoming.claimKey &&
    existing.valueFingerprint !== incoming.valueFingerprint
  ) {
    return "CONFLICT";
  }

  return "CREATE";
}
