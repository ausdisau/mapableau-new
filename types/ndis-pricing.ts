import { z } from "zod";

/** NDIS pricing domain types — not funding approval or eligibility decisions. */

export const NDIS_DISCLAIMER =
  "This check compares line items to your uploaded NDIS price catalogue. It does not approve funding, plan budgets, or NDIA claims.";

export const priceRowSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  priceCapCents: z.number().int().nonnegative().optional(),
  unitType: z.string().optional(),
  category: z.string().optional(),
  registrationGroup: z.string().optional(),
  serviceTypes: z.array(z.string()).optional(),
  providerTypes: z.array(z.string()).optional(),
});

export type PriceRow = z.infer<typeof priceRowSchema>;

export const catalogueImportSchema = z.object({
  fileName: z.string().optional(),
  catalogueName: z.string().optional(),
  versionLabel: z.string().optional(),
  rows: z.array(priceRowSchema).min(1),
  csvText: z.string().optional(),
});

export const supportItemSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  registrationGroup: z.string().optional(),
  serviceType: z.string().optional(),
  activeOnly: z.coerce.boolean().optional().default(true),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const matchSupportItemSchema = z.object({
  description: z.string().optional(),
  serviceType: z.string().optional(),
  providerType: z.string().optional(),
  registrationGroup: z.string().optional(),
  context: z.record(z.string(), z.unknown()).optional(),
  limit: z.coerce.number().int().min(1).max(20).optional().default(5),
});

export const quoteLineInputSchema = z.object({
  supportItemCode: z.string().optional(),
  description: z.string().min(1),
  quantity: z.coerce.number().positive().default(1),
  unitType: z.string().optional(),
  serviceDate: z.string().datetime().optional(),
  unitAmountCents: z.number().int().nonnegative().optional(),
});

export const calculateQuoteSchema = z.object({
  lines: z.array(quoteLineInputSchema).min(1),
  participantId: z.string().optional(),
  organisationId: z.string().optional(),
  versionId: z.string().optional(),
});

export const validateInvoiceLineSchema = z.object({
  supportItemCode: z.string().optional().nullable(),
  description: z.string().min(1),
  quantity: z.coerce.number().positive().default(1),
  unitAmountCents: z.number().int(),
  totalAmountCents: z.number().int().optional(),
  unitType: z.string().optional(),
  serviceDate: z.string().datetime().optional(),
  claimableByNdis: z.boolean().optional(),
});

export type PricingWarning = {
  code: string;
  severity: "info" | "warning" | "error";
  message: string;
  plainMessage?: string;
  technicalMessage?: string;
};

export type SupportItemMatch = {
  supportItemId: string;
  code: string;
  name: string;
  score: number;
  confidence: "high" | "medium" | "low";
  reasons: string[];
  warnings: PricingWarning[];
};

export type QuoteLineResult = {
  description: string;
  supportItemCode?: string;
  quantity: number;
  unitType?: string;
  unitAmountCents?: number;
  totalAmountCents?: number;
  priceCapCents?: number;
  warnings: PricingWarning[];
  status: "calculated" | "review_required";
};

export type InvoiceLineValidationResult = {
  valid: boolean;
  warnings: PricingWarning[];
  findings: PricingWarning[];
  disclaimer: string;
};

export type ClaimValidationResult = {
  runId: string;
  invoiceId: string;
  status: "completed" | "failed";
  summary: string;
  disclaimer: string;
  warningsCount: number;
  errorsCount: number;
  findings: Array<{
    code: string;
    severity: string;
    audience: string;
    plainMessage?: string | null;
    technicalMessage: string;
    invoiceLineId?: string | null;
    supportItemCode?: string | null;
  }>;
};
