import { z } from "zod";

export const createPlanSchema = z.object({
  title: z.string().min(1).max(200),
  ndisNumber: z.string().max(50).optional(),
  planStartAt: z.string().datetime().optional(),
  planEndAt: z.string().datetime().optional(),
  totalBudgetCents: z.number().int().min(0).optional(),
  notes: z.string().max(2000).optional(),
  participantId: z.string().optional(),
});

export const updatePlanSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  ndisNumber: z.string().max(50).optional(),
  status: z.enum(["draft", "active", "ended"]).optional(),
  planStartAt: z.string().datetime().optional().nullable(),
  planEndAt: z.string().datetime().optional().nullable(),
  totalBudgetCents: z.number().int().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

export const createBudgetCategorySchema = z.object({
  name: z.string().min(1).max(120),
  categoryCode: z.string().max(50).optional(),
  allocatedCents: z.number().int().min(0),
  description: z.string().max(500).optional(),
});

export const createFundingPeriodSchema = z.object({
  label: z.string().min(1).max(120),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

export const createProviderSchema = z.object({
  legalName: z.string().min(1).max(200),
  abn: z.string().max(20).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(30).optional(),
  organisationId: z.string().optional(),
});

export const invoiceLineItemSchema = z.object({
  description: z.string().min(1).max(500),
  serviceDate: z.string().datetime(),
  quantity: z.number().positive().optional(),
  unitPriceCents: z.number().int().min(0),
  supportItemCode: z.string().max(50).optional(),
  budgetCategoryId: z.string().optional(),
});

export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().max(100).optional(),
  participantId: z.string().optional(),
  providerId: z.string().optional(),
  planId: z.string().optional(),
  issueDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  serviceAgreementLinked: z.boolean().optional(),
  serviceAgreementId: z.string().optional(),
  notes: z.string().max(2000).optional(),
  lineItems: z.array(invoiceLineItemSchema).min(1).optional(),
});

export const updateInvoiceSchema = z.object({
  invoiceNumber: z.string().max(100).optional(),
  providerId: z.string().optional().nullable(),
  planId: z.string().optional().nullable(),
  status: z
    .enum([
      "draft",
      "submitted",
      "in_review",
      "awaiting_participant",
      "approved",
      "rejected",
      "exported",
    ])
    .optional(),
  issueDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  serviceAgreementLinked: z.boolean().optional(),
  serviceAgreementId: z.string().optional().nullable(),
  notes: z.string().max(2000).optional(),
});

export const approvalSchema = z.object({
  notes: z.string().max(2000).optional(),
  confirmHuman: z.literal(true),
});

export const rejectSchema = z.object({
  notes: z.string().min(1).max(2000),
  confirmHuman: z.literal(true),
});

export const exportClaimPackSchema = z.object({
  invoiceIds: z.array(z.string()).min(1).optional(),
  planId: z.string().optional(),
});

export const exportStatementSchema = z.object({
  planId: z.string(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

export type InvoiceValidationCheck = {
  abnPresent: boolean;
  invoiceNumberPresent: boolean;
  participantIdentifierPresent: boolean;
  providerIdentifierPresent: boolean;
  datesOfSupportPresent: boolean;
  supportItemCodePresent: boolean;
  supportItemPricePresent: boolean;
  duplicateInvoice: boolean;
  priceLimitStatus: "pass" | "warning" | "fail" | "unknown";
  serviceAgreementLinked: boolean;
};

export type InvoiceValidationResult = {
  passed: boolean;
  checks: InvoiceValidationCheck;
  failedReasons: string[];
  checkedAt: string;
};

export type AiInvoiceSuggestion = {
  invoiceType: string;
  missingFields: string[];
  categorySuggestions: { lineIndex: number; categoryName: string; confidence: number }[];
  draftQuestions: string[];
  duplicateLikely: boolean;
  disclaimer: string;
};
