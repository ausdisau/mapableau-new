import { z } from "zod";

export const integrationProviderSchema = z.enum(["deputy", "xero", "stripe"]);
export type IntegrationProviderName = z.infer<typeof integrationProviderSchema>;

export const integrationDeliveryStateSchema = z.enum([
  "pending",
  "running",
  "delivered",
  "retryable",
  "needs_review",
  "dead_letter",
]);
export type IntegrationDeliveryStateName = z.infer<
  typeof integrationDeliveryStateSchema
>;

export const integrationInternalEntitySchema = z.enum([
  "worker_profile",
  "care_shift",
  "billing_invoice",
  "billing_contact",
  "stripe_account",
  "deputy_employee",
  "deputy_opunit",
  "xero_contact",
  "xero_item",
  "xero_account",
]);
export type IntegrationInternalEntity = z.infer<
  typeof integrationInternalEntitySchema
>;

/** Minimal payload references — never embed clinical notes or home addresses. */
export const integrationPayloadRefSchema = z.object({
  bookingId: z.string().optional(),
  careBookingId: z.string().optional(),
  careShiftId: z.string().optional(),
  workerProfileId: z.string().optional(),
  billingInvoiceId: z.string().optional(),
  timesheetId: z.string().optional(),
  fundingSourceType: z.string().optional(),
});
export type IntegrationPayloadRef = z.infer<typeof integrationPayloadRefSchema>;

export const enqueueDeliveryInputSchema = z.object({
  eventId: z.string().min(1),
  aggregateType: z.string().min(1),
  aggregateId: z.string().min(1),
  aggregateRevision: z.number().int().positive().default(1),
  provider: integrationProviderSchema,
  organisationId: z.string().min(1),
  externalTenantId: z.string().optional(),
  dedupeKey: z.string().min(1),
  payloadRef: integrationPayloadRefSchema.optional(),
});
export type EnqueueDeliveryInput = z.infer<typeof enqueueDeliveryInputSchema>;

export const upsertMappingInputSchema = z.object({
  organisationId: z.string().min(1),
  provider: integrationProviderSchema,
  internalType: z.string().min(1),
  internalId: z.string().min(1),
  externalId: z.string().min(1),
  externalVersion: z.string().optional(),
  syncState: z.string().default("active"),
  metadataJson: z.record(z.string(), z.unknown()).optional(),
});
export type UpsertMappingInput = z.infer<typeof upsertMappingInputSchema>;
