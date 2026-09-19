/**
 * Access Integration Gateway — provider-neutral contracts.
 * External systems never become MapAble's canonical domain model.
 *
 * Flow: External → Adapter → Validation → Provenance → MapAble contract → GAIS
 */

import { z } from "zod";

export const ACCESS_PROVIDER_IDS = [
  "panoramax",
  "project_sidewalk",
  "overture",
  "open311",
  "odk",
  "sensorthings",
  "openstreetmap",
  "opentripplanner",
  "openrouteservice",
  "valhalla",
  "mapable_quests",
  "sandbox",
] as const;
export type AccessProviderId = (typeof ACCESS_PROVIDER_IDS)[number];

export const CONTRIBUTOR_TYPES = [
  "COMMUNITY",
  "OPERATOR",
  "GOVERNMENT",
  "PROFESSIONAL",
  "SENSOR",
  "AI",
  "ROBOTIC_SURVEY",
  "OTHER",
] as const;
export type ContributorType = (typeof CONTRIBUTOR_TYPES)[number];

export const VERIFICATION_STATES = [
  "UNVERIFIED",
  "COMMUNITY_REPORTED",
  "CORROBORATED",
  "OPERATOR_CONFIRMED",
  "PROFESSIONALLY_VERIFIED",
  "DISPUTED",
  "STALE",
] as const;
export type VerificationState = (typeof VERIFICATION_STATES)[number];

export const PUBLICATION_STATES = [
  "PRIVATE_EVIDENCE",
  "MAPABLE_COMMUNITY_EVIDENCE",
  "PUBLIC_EVIDENCE",
  "EXTERNAL_PUBLICATION_APPROVED",
] as const;
export type PublicationState = (typeof PUBLICATION_STATES)[number];

export const VALUE_QUALIFIERS = [
  "MEASURED",
  "ESTIMATED",
  "EXPERIENCED",
  "UNKNOWN",
] as const;
export type ValueQualifier = (typeof VALUE_QUALIFIERS)[number];

export const evidenceRefSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum([
      "image",
      "document",
      "url",
      "sensor_reading",
      "label",
      "other",
    ]),
    uri: z.string().min(1).optional(),
    contentType: z.string().optional(),
    publicationState: z.enum(PUBLICATION_STATES),
    capturedAt: z.string().optional(),
    checksumSha256: z.string().optional(),
  })
  .strict();
export type EvidenceRef = z.infer<typeof evidenceRefSchema>;

export const provenanceSchema = z
  .object({
    sourceType: z.string().min(1),
    sourceProvider: z.enum(ACCESS_PROVIDER_IDS),
    sourceReference: z.string().optional(),
    sourceUrl: z.string().optional(),
    capturedAt: z.string().optional(),
    receivedAt: z.string(),
    contributorType: z.enum(CONTRIBUTOR_TYPES),
    verificationState: z.enum(VERIFICATION_STATES),
    confidence: z.number().min(0).max(1).optional(),
    evidenceRefs: z.array(evidenceRefSchema).default([]),
    attribution: z.string().optional(),
    licence: z.string().optional(),
  })
  .strict();
export type EvidenceProvenance = z.infer<typeof provenanceSchema>;

export const normalizedObservationSchema = z
  .object({
    featureType: z.string().min(1),
    attribute: z.string().min(1),
    value: z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.literal("UNKNOWN"),
      z.null(),
    ]),
    valueQualifier: z.enum(VALUE_QUALIFIERS).default("UNKNOWN"),
    geometry: z
      .object({
        type: z.literal("Point"),
        coordinates: z.tuple([z.number(), z.number()]),
      })
      .optional(),
    placeId: z.string().optional(),
    observedAt: z.string().optional(),
    notes: z.string().max(2000).optional(),
    provenance: provenanceSchema,
    claimStrength: z
      .enum(["observation", "corroborated", "capability_candidate"])
      .default("observation"),
  })
  .strict();
export type NormalizedObservation = z.infer<typeof normalizedObservationSchema>;

export const evidenceRequestSchema = z
  .object({
    reference: z.string().min(1),
    bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  })
  .strict();
export type EvidenceRequest = z.infer<typeof evidenceRequestSchema>;

export type EvidenceResult = {
  providerId: AccessProviderId;
  references: EvidenceRef[];
  rawSummary?: string;
};

export type ProviderHealth = {
  providerId: AccessProviderId;
  configured: boolean;
  reachable: boolean;
  latencyMs: number | null;
  version: string | null;
  checkedAt: string;
  message?: string;
};

export interface AccessEvidenceProvider {
  readonly providerId: AccessProviderId;
  isEnabled(): boolean;
  healthCheck(): Promise<ProviderHealth>;
  resolveEvidence(request: EvidenceRequest): Promise<EvidenceResult>;
  normalizeObservation(input: unknown): Promise<NormalizedObservation>;
}

export function assertExternalPublicationAllowed(state: PublicationState): void {
  if (state !== "EXTERNAL_PUBLICATION_APPROVED") {
    throw new Error(
      `External publication denied: publicationState=${state}`,
    );
  }
}

export function createUnverifiedProvenance(input: {
  sourceProvider: AccessProviderId;
  sourceReference?: string;
  sourceUrl?: string;
  contributorType?: ContributorType;
  evidenceRefs?: EvidenceRef[];
  attribution?: string;
  licence?: string;
  confidence?: number;
  capturedAt?: string;
}): EvidenceProvenance {
  return provenanceSchema.parse({
    sourceType: "external_observation",
    sourceProvider: input.sourceProvider,
    sourceReference: input.sourceReference,
    sourceUrl: input.sourceUrl,
    capturedAt: input.capturedAt,
    receivedAt: new Date().toISOString(),
    contributorType: input.contributorType ?? "COMMUNITY",
    verificationState: "UNVERIFIED",
    confidence: input.confidence,
    evidenceRefs: input.evidenceRefs ?? [],
    attribution: input.attribution,
    licence: input.licence,
  });
}
