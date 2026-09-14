import { z } from "zod";

export const autonomyDefaultPostureSchema = z.literal("PREPARE_THEN_CONFIRM");

export const autonomyPreparationClassSchema = z.enum([
  "ORDINARY",
  "GUARDED",
  "PROHIBITED_AI_AUTHORITY",
]);

export const standingAuthorityConstraintV1Schema = z
  .object({
    enabled: z.boolean(),
    action: z.string().trim().min(1).max(200),
    purpose: z.string().trim().min(1).max(300),
    providerRef: z.string().trim().min(1).max(200).optional(),
    workerRef: z.string().trim().min(1).max(200).optional(),
    recipientRef: z.string().trim().min(1).max(200).optional(),
    dataScopes: z.array(z.string().trim().min(1).max(160)).max(50).optional(),
    maxAmountMinorUnits: z.number().int().nonnegative().optional(),
    currency: z.string().regex(/^[A-Z]{3}$/).optional(),
    maxScheduleShiftMinutes: z.number().int().nonnegative().optional(),
    expiresAt: z.string().datetime(),
  })
  .strict();

export const participantAutonomyPolicyConstraintV1Schema = z
  .object({
    version: z.literal("1"),
    defaultPosture: autonomyDefaultPostureSchema,
    preparationClass: autonomyPreparationClassSchema,
    standingAuthority: standingAuthorityConstraintV1Schema.optional(),
  })
  .strict();

export type StandingAuthorityConstraintV1 = z.infer<
  typeof standingAuthorityConstraintV1Schema
>;
export type ParticipantAutonomyPolicyConstraintV1 = z.infer<
  typeof participantAutonomyPolicyConstraintV1Schema
>;
