import { z } from "zod";

export const fundingSourceTypeSchema = z.enum([
  "ndis_plan_managed",
  "ndis_self_managed",
  "private_card",
  "organisation_invoice",
  "grant",
  "other",
]);

export const createFundingSourceSchema = z.object({
  type: fundingSourceTypeSchema,
  label: z.string().min(1).max(200),
  ndisParticipantNumber: z.string().max(50).optional(),
  planManagerName: z.string().max(200).optional(),
  planManagerEmail: z.string().email().optional(),
  isDefault: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const invoiceServiceTypeSchema = z.enum([
  "care",
  "transport",
  "jobs",
  "marketplace",
  "subscription",
  "other",
]);

export const createInvoiceLineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().int().positive().default(1),
  unitAmountCents: z.number().int().nonnegative(),
  ndisLineItem: z.string().max(50).optional(),
  gstApplicable: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const createInvoiceSchema = z.object({
  providerId: z.string().uuid().optional(),
  bookingId: z.string().max(100).optional(),
  serviceType: invoiceServiceTypeSchema,
  fundingSourceId: z.string().cuid().optional(),
  ndisLineItem: z.string().max(50).optional(),
  ndisClaimable: z.boolean().optional(),
  dueAt: z.string().datetime().optional(),
  platformFeeCents: z.number().int().nonnegative().optional(),
  lineItems: z.array(createInvoiceLineItemSchema).min(1),
});

export const checkoutSchema = z.object({
  invoiceId: z.string().cuid(),
});

export const subscriptionCheckoutSchema = z.object({
  planCode: z.enum(["provider_pro", "employer_pro", "marketplace_featured", "other"]),
});

export const invoiceExportSchema = z.object({
  invoiceId: z.string().cuid(),
  format: z.enum(["csv", "xero", "plan_manager"]),
});

export const connectAccountRoleSchema = z.enum([
  "participant",
  "provider",
  "employer",
  "admin",
]);

export const createConnectAccountSchema = z.object({
  role: z.enum(["provider", "employer"]).default("provider"),
});

export type CreateFundingSourceInput = z.infer<typeof createFundingSourceSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type SubscriptionCheckoutInput = z.infer<
  typeof subscriptionCheckoutSchema
>;
export type InvoiceExportInput = z.infer<typeof invoiceExportSchema>;
