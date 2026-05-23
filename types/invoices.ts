import type { CoreInvoiceStatus } from "@/lib/domain/invoice-status";

export type { CoreInvoiceStatus };

export interface InvoiceLineItemDto {
  id?: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  ndisSupportCategory?: string | null;
  ndisLineItem?: string | null;
  gstApplicable?: boolean;
  serviceDate?: string;
}

export interface InvoiceSummaryDto {
  id: string;
  invoiceNumber?: string | null;
  bookingId?: string | null;
  participantId: string;
  organisationId?: string | null;
  status: CoreInvoiceStatus;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  participantGapCents: number;
  ndisClaimableCents: number;
  issuedAt?: string | null;
  dueAt?: string | null;
  paidAt?: string | null;
}

export interface ApproveInvoiceRequestDto {
  approvedByRole: "participant" | "family_member" | "plan_manager";
  notes?: string;
}

export interface IssueInvoiceRequestDto {
  dueInDays?: number;
  notes?: string;
}

export interface XeroPreviewLineItem {
  description: string;
  quantity: number;
  unitAmount: number;
  accountCode: string;
  taxType: string;
}

export interface XeroInvoicePayload {
  type: "ACCREC";
  contact: {
    name: string;
    email?: string;
  };
  invoiceNumber: string;
  date: string;
  dueDate: string;
  lineItems: XeroPreviewLineItem[];
  reference: string;
  status: "DRAFT" | "SUBMITTED" | "AUTHORISED";
}
