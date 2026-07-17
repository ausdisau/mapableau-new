import { z } from "zod";

export const ServiceStandardFieldKeySchema = z.enum([
  "preferred_name",
  "communication_mode",
  "arrival_lateness_expectation",
  "contact_method",
  "processing_time",
  "privacy_preferences",
  "household_boundaries",
  "support_person_involvement",
  "assistance_boundaries",
  "documentation_preferences",
  "cancellation_communication",
  "worker_introduction_requirements",
  "transport_handover_requirements",
  "cultural_language_preferences",
  "sensory_preferences",
  "feedback_method",
]);

export type ServiceStandardFieldKey = z.infer<
  typeof ServiceStandardFieldKeySchema
>;

export const ServiceStandardFieldSchema = z
  .object({
    key: ServiceStandardFieldKeySchema,
    value: z.string().min(1).max(2000),
    requirementLevel: z.enum(["hard_requirement", "preference"]),
    shareWith: z.array(z.enum(["worker", "provider", "navigator", "none"])),
    source: z.enum(["participant", "delegate_with_authority"]),
    consentBasis: z.string().min(1).max(200),
    effectiveFrom: z.string().datetime(),
    effectiveTo: z.string().datetime().nullable(),
  })
  .strict();

export type ServiceStandardField = z.infer<typeof ServiceStandardFieldSchema>;

export const ParticipantServiceStandardSchema = z
  .object({
    id: z.string().min(1),
    participantId: z.string().min(1),
    organisationId: z.string().min(1),
    version: z.number().int().positive(),
    status: z.enum(["draft", "active", "superseded", "revoked"]),
    fields: z.array(ServiceStandardFieldSchema).min(1),
    participantApprovedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    /** Never inferred from diagnosis. */
    diagnosisInferred: z.literal(false),
    providerAuthoredSubstitute: z.literal(false),
  })
  .strict();

export type ParticipantServiceStandard = z.infer<
  typeof ParticipantServiceStandardSchema
>;

export const ServiceStandardAcknowledgementSchema = z
  .object({
    standardId: z.string().min(1),
    standardVersion: z.number().int().positive(),
    actorType: z.enum(["worker", "provider", "navigator"]),
    actorId: z.string().min(1),
    acknowledgedAt: z.string().datetime(),
    sharedFieldKeys: z.array(ServiceStandardFieldKeySchema),
  })
  .strict();

export type ServiceStandardAcknowledgement = z.infer<
  typeof ServiceStandardAcknowledgementSchema
>;
