import { z } from "zod";

export const dclmfSchemaVersion = "1.0" as const;

export const dclmfMemoryCategorySchema = z.enum([
  "identity",
  "access",
  "baseline",
  "episodic",
  "preference",
  "procedural",
  "relational",
  "correction",
  "evidence",
]);

export const dclmfSourceTypeSchema = z.enum([
  "self_report",
  "aac",
  "supporter",
  "clinician",
  "record",
  "sensor",
  "model_inference",
  "simulation_author",
  "system",
]);

export const dclmfConfidenceSchema = z.enum([
  "authoritative",
  "high",
  "medium",
  "low",
  "unknown",
]);

export const dclmfMemoryScopeSchema = z.enum([
  "turn",
  "session",
  "service",
  "persistent",
]);

export const dclmfMemoryStatusSchema = z.enum([
  "active",
  "superseded",
  "contested",
  "revoked",
]);

export const dclmfDataClassSchema = z.enum([
  "public",
  "project_internal",
  "person_private",
  "sensitive_personal",
  "health_related",
  "emergency_only",
  "local_only",
]);

export const dclmfMemoryWriteSchema = z
  .object({
    schemaVersion: z.literal(dclmfSchemaVersion).default(dclmfSchemaVersion),
    participantId: z.string().min(1),
    category: dclmfMemoryCategorySchema,
    payload: z.unknown().nullable().optional(),
    payloadRef: z.string().min(1).nullable().optional(),
    sourceType: dclmfSourceTypeSchema,
    sourceRef: z.string().min(1).nullable().optional(),
    confidence: dclmfConfidenceSchema,
    scope: dclmfMemoryScopeSchema,
    dataClass: dclmfDataClassSchema,
    purposeTags: z.array(z.string().min(1)).default([]),
    evidenceRefs: z.array(z.string().min(1)).default([]),
    observedAt: z.string().datetime().nullable().optional(),
    validFrom: z.string().datetime().nullable().optional(),
    validUntil: z.string().datetime().nullable().optional(),
    consentRecordId: z.string().min(1).nullable().optional(),
  })
  .strict();

export const dclmfProjectionRequestSchema = z
  .object({
    schemaVersion: z.literal(dclmfSchemaVersion).default(dclmfSchemaVersion),
    participantId: z.string().min(1),
    actorUserId: z.string().min(1),
    organisationId: z.string().min(1).nullable().optional(),
    purpose: z.string().min(3).max(240),
    service: z.enum([
      "mapable_core",
      "mapable_care",
      "mapable_transport",
      "mapable_jobs",
      "project_hope",
      "other",
    ]),
    categories: z.array(dclmfMemoryCategorySchema).min(1),
    consentScope: z.string().min(1).nullable().optional(),
    maxDataClass: dclmfDataClassSchema.default("person_private"),
    includeContested: z.boolean().default(false),
  })
  .strict();

export const dclmfProjectedMemorySchema = z
  .object({
    id: z.string().min(1),
    category: dclmfMemoryCategorySchema,
    payload: z.unknown().nullable(),
    payloadRef: z.string().nullable(),
    sourceType: dclmfSourceTypeSchema,
    sourceRef: z.string().nullable(),
    confidence: dclmfConfidenceSchema,
    scope: dclmfMemoryScopeSchema,
    dataClass: dclmfDataClassSchema,
    evidenceRefs: z.array(z.string()),
    observedAt: z.string().datetime().nullable(),
    validFrom: z.string().datetime().nullable(),
    validUntil: z.string().datetime().nullable(),
    supersedesId: z.string().nullable(),
    status: dclmfMemoryStatusSchema,
  })
  .strict();

export const dclmfProjectionSchema = z
  .object({
    schemaVersion: z.literal(dclmfSchemaVersion),
    participantId: z.string().min(1),
    purpose: z.string().min(1),
    service: dclmfProjectionRequestSchema.shape.service,
    generatedAt: z.string().datetime(),
    authoritySource: z.enum(["participant_self", "consent"]),
    consentRecordId: z.string().nullable(),
    records: z.array(dclmfProjectedMemorySchema),
    unresolved: z.array(z.string()),
    limitations: z.array(z.string()),
  })
  .strict();

export const projectHopeDclmfInputSchema = z
  .object({
    dataOrigin: z.literal("fictional_synthetic"),
    fictionalPatient: z.literal(true),
    scenarioId: z.string().min(1),
    participantId: z.string().min(1),
    records: z.array(dclmfProjectedMemorySchema),
  })
  .strict();

export type DclmfMemoryCategory = z.infer<typeof dclmfMemoryCategorySchema>;
export type DclmfSourceType = z.infer<typeof dclmfSourceTypeSchema>;
export type DclmfConfidence = z.infer<typeof dclmfConfidenceSchema>;
export type DclmfMemoryScope = z.infer<typeof dclmfMemoryScopeSchema>;
export type DclmfMemoryStatus = z.infer<typeof dclmfMemoryStatusSchema>;
export type DclmfDataClass = z.infer<typeof dclmfDataClassSchema>;
export type DclmfMemoryWrite = z.infer<typeof dclmfMemoryWriteSchema>;
export type DclmfProjectionRequest = z.infer<typeof dclmfProjectionRequestSchema>;
export type DclmfProjectedMemory = z.infer<typeof dclmfProjectedMemorySchema>;
export type DclmfProjection = z.infer<typeof dclmfProjectionSchema>;
export type ProjectHopeDclmfInput = z.infer<typeof projectHopeDclmfInputSchema>;
