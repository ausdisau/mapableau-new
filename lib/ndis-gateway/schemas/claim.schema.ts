import { z } from "zod";

import { CANONICAL_CLAIM_STATUSES } from "@/lib/ndis-gateway/domain/claim-status";
import { FUNDING_ROUTES } from "@/lib/ndis-gateway/domain/funding-route";

export const fundingRouteSchema = z.enum(FUNDING_ROUTES);

export const canonicalClaimStatusSchema = z.enum(CANONICAL_CLAIM_STATUSES);

export const canonicalClaimSourceTypeSchema = z.enum([
  "booking",
  "care_shift",
  "timesheet",
  "ndis_invoice",
  "billing_invoice",
  "legacy_invoice",
  "manual",
]);

export const canonicalClaimLineSchema = z.object({
  lineNumber: z.number().int().positive(),
  supportItemCode: z.string().min(1),
  supportDescription: z.string(),
  serviceStartDate: z.string().min(1),
  serviceEndDate: z.string().min(1),
  quantity: z.number().positive(),
  unitPriceCents: z.number().int().nonnegative(),
  totalCents: z.number().int().nonnegative(),
  gstIncluded: z.boolean(),
});

/** Boundary schema for canonical claims entering the gateway. */
export const canonicalNdisClaimSchema = z.object({
  id: z.string().optional(),
  schemaVersion: z.literal("1"),
  status: canonicalClaimStatusSchema,
  fundingRoute: fundingRouteSchema,
  sourceType: canonicalClaimSourceTypeSchema,
  sourceId: z.string().min(1),
  provider: z.object({
    organisationId: z.string().min(1),
    name: z.string().min(1),
    abn: z.string().nullable(),
    ndisRegistrationNumber: z.string().nullable(),
    registrationClaimed: z.boolean(),
  }),
  participant: z.object({
    mapableUserId: z.string().min(1),
    ndisNumberMasked: z.string().nullable(),
    displayName: z.string().nullable().optional(),
  }),
  servicePeriod: z.object({
    start: z.string().min(1),
    end: z.string().min(1),
  }),
  lines: z.array(canonicalClaimLineSchema).min(1),
  totals: z.object({
    subtotalCents: z.number().int().nonnegative(),
    taxCents: z.number().int().nonnegative(),
    totalCents: z.number().int().nonnegative(),
    currency: z.string().min(1),
  }),
  correlationId: z.string().optional(),
  payloadHash: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CanonicalNdisClaimInput = z.infer<typeof canonicalNdisClaimSchema>;
