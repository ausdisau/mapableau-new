import { z } from "zod";

export const INVOICE_STATUSES = [
  "draft",
  "awaiting_participant_approval",
  "approved",
  "issued",
  "payment_pending",
  "paid",
  "partially_paid",
  "sent_to_plan_manager",
  "xero_sync_pending",
  "xero_synced",
  "overdue",
  "disputed",
  "void",
  "refunded",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export type InvoiceItem = {
  id?: string;
  description: string;
  plainDescription?: string;
  serviceDate: string;
  quantity: number;
  unitAmountCents: number;
  totalAmountCents: number;
  supportItemCode?: string;
  claimableByNdis?: boolean;
  privatePayAmountCents?: number;
  ndisClaimableAmountCents?: number;
  taxCode?: string;
  xeroAccountCode?: string;
  xeroTaxType?: string;
};

export type Invoice = {
  id: string;
  invoiceNumber?: string | null;
  participantId: string;
  organisationId?: string | null;
  status: InvoiceStatus | string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  privatePayCents?: number | null;
  currency: string;
  lines?: InvoiceItem[];
};

export type PaymentRecord = {
  id: string;
  invoiceId: string;
  amountCents: number;
  status: string;
  method: "stripe_checkout" | "manual" | "plan_manager";
  paidAt?: string | null;
};

export type BillingEvent = {
  id: string;
  invoiceId: string;
  eventType: string;
  message?: string | null;
  createdAt: string;
};

export const invoiceLineInputSchema = z.object({
  description: z.string().min(1),
  plainDescription: z.string().optional(),
  serviceDate: z.string().datetime(),
  quantity: z.coerce.number().positive().default(1),
  unitAmountCents: z.number().int().nonnegative(),
  supportItemCode: z.string().optional(),
  claimableByNdis: z.boolean().optional(),
  privatePayAmountCents: z.number().int().nonnegative().optional(),
  ndisClaimableAmountCents: z.number().int().nonnegative().optional(),
  taxCode: z.string().optional(),
  xeroAccountCode: z.string().optional(),
  xeroTaxType: z.string().optional(),
});

export const createInvoiceSchema = z.object({
  participantId: z.string().optional(),
  organisationId: z.string().optional(),
  bookingId: z.string().optional(),
  fundingSourceId: z.string().optional(),
  serviceType: z.string().optional(),
  requiresParticipantApproval: z.boolean().optional(),
  lines: z.array(invoiceLineInputSchema).min(1),
  notes: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

export const patchInvoiceSchema = z.object({
  notes: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  lines: z.array(invoiceLineInputSchema).optional(),
});

export const approveInvoiceSchema = z.object({
  notes: z.string().optional(),
});

export const disputeInvoiceSchema = z.object({
  reason: z.string().min(10).max(2000),
});

export const manualPaymentSchema = z.object({
  amountCents: z.number().int().positive(),
  notes: z.string().optional(),
  mfaConfirmed: z.boolean().optional(),
});

export const PAYMENT_DISCLAIMER =
  "Payments are processed by Stripe. MapAble does not store your card details.";
