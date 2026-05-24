import { z } from "zod";

export const abnLookupBodySchema = z.object({
  abn: z.string().min(1).max(20),
});

export const decideVerificationCaseSchema = z.object({
  outcome: z.enum([
    "approved",
    "approved_with_conditions",
    "rejected",
    "suspended",
    "more_information_required",
  ]),
  conditions: z.string().optional(),
  reason: z.string().optional(),
});

export const contractorAbnSchema = z
  .string()
  .max(20)
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v));
