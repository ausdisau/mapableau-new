import { z } from "zod";

/**
 * Canonical evidence provenance for the Access Evidence Graph.
 * Unifies portfolio, infrastructure, GAIS, and intelligence-next vocabularies.
 *
 * False-safe rule: `unknown` and `stale` must never collapse into inaccessible.
 */
export const EVIDENCE_PROVENANCE_VALUES = [
  "verified",
  "authoritative",
  "community_confirmed",
  "inferred",
  "stale",
  "unknown",
] as const;

export const evidenceProvenanceSchema = z.enum(EVIDENCE_PROVENANCE_VALUES);
export type EvidenceProvenance = z.infer<typeof evidenceProvenanceSchema>;

export const EVIDENCE_PROVENANCE_LABELS: Record<EvidenceProvenance, string> = {
  verified: "Independently verified",
  authoritative: "Authoritative source",
  community_confirmed: "Community confirmed",
  inferred: "Inferred — unverified",
  stale: "Stale — needs refresh",
  unknown: "Unknown",
};

/** Storage-layer provenance statuses (Prisma / infrastructure). */
export const ACCESS_STORAGE_PROVENANCE_STATUSES = [
  "verified",
  "observed",
  "venue_reported",
  "community_reported",
  "unknown",
  "outdated",
  "disputed",
] as const;

export type AccessStorageProvenanceStatus =
  (typeof ACCESS_STORAGE_PROVENANCE_STATUSES)[number];

/** Portfolio source classes (infrastructure intake). */
export const ACCESS_SOURCE_CLASSES = [
  "community_reported",
  "organisation_supplied",
  "assessor_measured",
  "sensor_observed",
  "ai_inferred",
  "independently_verified",
  "unknown",
  "expired",
] as const;

export type AccessSourceClass = (typeof ACCESS_SOURCE_CLASSES)[number];

/** GAIS uppercase evidence states. */
export const GAIS_EVIDENCE_STATES = [
  "VERIFIED",
  "AUTHORITATIVE_SOURCE",
  "PROVIDER_OR_VENUE_DECLARED",
  "COMMUNITY_REPORTED",
  "SENSOR_OBSERVED",
  "AI_INFERRED",
  "UNKNOWN",
] as const;

export type GaisEvidenceState = (typeof GAIS_EVIDENCE_STATES)[number];

export const accessGraphDisputeEntrySchema = z.object({
  reportedAt: z.string().datetime(),
  summary: z.string().min(1).max(500),
  status: z.enum(["open", "resolved", "withdrawn"]),
}).strict();

export const accessGraphAssertionProvenanceSchema = z.object({
  provenance: evidenceProvenanceSchema,
  source: z.string().min(1),
  timestamp: z.string().datetime(),
  evidenceType: z.string().min(1),
  verificationState: evidenceProvenanceSchema,
  confidence: z.number().min(0).max(1).nullable(),
  expiryAt: z.string().datetime().nullable(),
  disputeHistory: z.array(accessGraphDisputeEntrySchema).default([]),
  displayLabel: z.string().min(1),
  /** True when routing must treat this as uncertain, not incompatible. */
  routingUncertainty: z.boolean(),
}).strict();

export type AccessGraphAssertionProvenance = z.infer<
  typeof accessGraphAssertionProvenanceSchema
>;

export function evidenceProvenanceLabel(
  provenance: EvidenceProvenance,
): string {
  return EVIDENCE_PROVENANCE_LABELS[provenance];
}

export function storageStatusToEvidenceProvenance(
  status: AccessStorageProvenanceStatus | string | null | undefined,
  options?: { freshnessExpired?: boolean },
): EvidenceProvenance {
  if (options?.freshnessExpired) {
    return "stale";
  }
  switch (status) {
    case "verified":
      return "verified";
    case "observed":
      return "inferred";
    case "venue_reported":
      return "authoritative";
    case "community_reported":
      return "community_confirmed";
    case "outdated":
      return "stale";
    case "disputed":
      return "unknown";
    case "unknown":
    default:
      return "unknown";
  }
}

export function sourceClassToEvidenceProvenance(
  sourceClass: AccessSourceClass | string | null | undefined,
  options?: { freshnessExpired?: boolean },
): EvidenceProvenance {
  if (options?.freshnessExpired || sourceClass === "expired") {
    return "stale";
  }
  switch (sourceClass) {
    case "independently_verified":
    case "assessor_measured":
      return "verified";
    case "organisation_supplied":
      return "authoritative";
    case "community_reported":
      return "community_confirmed";
    case "ai_inferred":
      return "inferred";
    case "sensor_observed":
      return "inferred";
    case "unknown":
    default:
      return "unknown";
  }
}

export function gaisStateToEvidenceProvenance(
  state: GaisEvidenceState | string | null | undefined,
): EvidenceProvenance {
  switch (state) {
    case "VERIFIED":
      return "verified";
    case "AUTHORITATIVE_SOURCE":
      return "authoritative";
    case "PROVIDER_OR_VENUE_DECLARED":
      return "authoritative";
    case "COMMUNITY_REPORTED":
      return "community_confirmed";
    case "SENSOR_OBSERVED":
    case "AI_INFERRED":
      return "inferred";
    case "UNKNOWN":
    default:
      return "unknown";
  }
}

export function evidenceClassToEvidenceProvenance(
  evidenceClass: string,
  temporalState?: string,
): EvidenceProvenance {
  if (temporalState === "stale" || temporalState === "expired") {
    return "stale";
  }
  if (temporalState === "unknown") {
    return "unknown";
  }
  switch (evidenceClass) {
    case "independently_verified_claim":
    case "professional_measurement":
      return "verified";
    case "authoritative_public_source":
    case "venue_declaration":
      return "authoritative";
    case "community_observation":
    case "moderated_claim":
      return "community_confirmed";
    case "model_candidate":
    case "device_assisted_estimate":
      return "inferred";
    case "synthetic_fixture":
      return "unknown";
    default:
      return "unknown";
  }
}

/** False-safe: unknown/stale/inferred → uncertain; only verified blocks can be decisive incompatible. */
export function provenanceToRoutingCompatibility(
  provenance: EvidenceProvenance,
  positiveIncompatibleEvidence = false,
): "compatible" | "compatible_with_adjustment" | "uncertain" | "incompatible" {
  switch (provenance) {
    case "verified":
      return positiveIncompatibleEvidence ? "incompatible" : "compatible";
    case "authoritative":
    case "community_confirmed":
      return positiveIncompatibleEvidence ? "uncertain" : "compatible_with_adjustment";
    case "inferred":
    case "stale":
    case "unknown":
      return "uncertain";
    default: {
      const _exhaustive: never = provenance;
      return _exhaustive;
    }
  }
}

export function isRoutingUncertaintyProvenance(
  provenance: EvidenceProvenance,
): boolean {
  return provenanceToRoutingCompatibility(provenance) === "uncertain";
}

export function buildAssertionProvenance(input: {
  provenance: EvidenceProvenance;
  source: string;
  timestamp: string;
  evidenceType: string;
  confidence?: number | null;
  expiryAt?: string | null;
  disputeHistory?: z.infer<typeof accessGraphDisputeEntrySchema>[];
}): AccessGraphAssertionProvenance {
  const routingUncertainty = isRoutingUncertaintyProvenance(input.provenance);
  return accessGraphAssertionProvenanceSchema.parse({
    provenance: input.provenance,
    source: input.source,
    timestamp: input.timestamp,
    evidenceType: input.evidenceType,
    verificationState: input.provenance,
    confidence: input.confidence ?? null,
    expiryAt: input.expiryAt ?? null,
    disputeHistory: input.disputeHistory ?? [],
    displayLabel: evidenceProvenanceLabel(input.provenance),
    routingUncertainty,
  });
}
