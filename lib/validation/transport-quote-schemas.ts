import { z } from "zod";

export const createOperatorQuoteSchema = z.object({
  tripId: z.string().cuid().optional(),
  tripRequestId: z.string().cuid().optional(),
  proposedDriverId: z.string().cuid().optional(),
  proposedVehicleId: z.string().cuid().optional(),
  estimatedPickupStart: z.string().datetime().optional(),
  estimatedPickupEnd: z.string().datetime().optional(),
  estimatedDurationSeconds: z.number().int().positive().optional(),
  estimatedDistanceMetres: z.number().int().nonnegative().optional(),
  fareBreakdownCents: z
    .object({
      baseCents: z.number().int().nonnegative().optional(),
      distanceCents: z.number().int().nonnegative().optional(),
      assistanceCents: z.number().int().nonnegative().optional(),
      tollsCents: z.number().int().nonnegative().optional(),
      participantPaidCents: z.number().int().nonnegative().optional(),
      potentiallyClaimableCents: z.number().int().nonnegative().optional(),
      platformFeeCents: z.number().int().nonnegative().optional(),
    })
    .default({}),
  totalCents: z.number().int().nonnegative(),
  currency: z.literal("AUD").default("AUD"),
  isEstimate: z.boolean().default(false),
  validUntil: z.string().datetime().optional(),
  cancellationTermsRef: z.string().max(500).optional(),
  idempotencyKey: z.string().min(8).max(128),
});

export const acceptQuoteSchema = z.object({
  idempotencyKey: z.string().min(8).max(128),
});

export const fundingDeclaredSchema = z.enum([
  "private_pay",
  "self_managed",
  "plan_managed",
  "ndia_managed",
  "other",
  "unsure",
]);
