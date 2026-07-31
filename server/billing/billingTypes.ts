import { z } from "zod";

export const fundingContextSchema = z.enum([
  "ndis_self_managed",
  "ndis_plan_managed",
  "ndis_agency_managed",
  "private",
  "mixed",
  "unknown",
]);

export type FundingContext = z.infer<typeof fundingContextSchema>;

export const draftInvoiceInputSchema = z.object({
  participantId: z.string().min(1),
  bookingIds: z.array(z.string().min(1)).min(1),
  fundingContext: fundingContextSchema,
});

export type DraftInvoiceInput = z.infer<typeof draftInvoiceInputSchema>;

export const evaluateGuardrailsInputSchema = z.object({
  invoiceId: z.string().min(1),
});

export const disputeInvoiceInputSchema = z.object({
  invoiceId: z.string().min(1),
  reason: z.string().min(1).max(2000),
});

export type BillingGuardrailId =
  | "billing_requires_service_evidence"
  | "participant_can_view_billing_summary"
  | "disputed_invoice_requires_human_review"
  | "billing_minimum_necessary_information"
  | "no_auto_claim_submission"
  | "unusual_price_requires_review";

export type GuardrailStatus = "pass" | "fail" | "review";

export interface GuardrailCheckResult {
  id: BillingGuardrailId;
  status: GuardrailStatus;
  message: string;
}

export interface GuardrailDecision {
  evaluatedAt: string;
  overallStatus: "approved_for_review" | "blocked" | "requires_human_review";
  checks: GuardrailCheckResult[];
  canSendOrSubmit: false;
  requiresApproval: boolean;
  blockReasons: string[];
}

export interface BookingEvidenceRef {
  bookingId: string;
  evidenceType: "timeline" | "care_shift" | "transport" | "booking_status";
  evidenceIds: string[];
  summary: string;
}

export interface AgenticInvoiceLineItem {
  id: string;
  bookingId: string;
  description: string;
  quantity: number;
  unitAmountCents: number;
  totalAmountCents: number;
  serviceDate: string;
  evidence: BookingEvidenceRef;
  ndisLineItem?: string;
}

export type AgenticInvoiceStatus =
  | "draft"
  | "pending_approval"
  | "disputed"
  | "approved"
  | "blocked";

export interface AgenticInvoiceDraft {
  id: string;
  participantId: string;
  bookingIds: string[];
  fundingContext: FundingContext;
  status: AgenticInvoiceStatus;
  currency: string;
  lineItems: AgenticInvoiceLineItem[];
  subtotalCents: number;
  totalCents: number;
  createdAt: string;
  createdByUserId: string;
  disputedAt?: string;
  disputeReason?: string;
  sendBlocked: boolean;
  claimSubmissionBlocked: true;
}

export interface ParticipantBillingSummary {
  invoiceId: string;
  participantId: string;
  status: AgenticInvoiceStatus;
  fundingContext: FundingContext;
  lineCount: number;
  totalCents: number;
  currency: string;
  plainLanguageSummary: string;
  lineSummaries: Array<{
    lineId: string;
    bookingId: string;
    description: string;
    totalAmountCents: number;
    evidenceSummary: string;
  }>;
  requiresYourApproval: boolean;
  canSendOrSubmit: false;
  nextSteps: string[];
}

export interface BillingGraphNode {
  id: string;
  type:
    | "participant"
    | "booking"
    | "evidence"
    | "line_item"
    | "invoice_draft"
    | "guardrail";
  label: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface BillingGraphEdge {
  from: string;
  to: string;
  relation:
    | "has_booking"
    | "supported_by"
    | "billed_on"
    | "evaluated_by"
    | "requires_approval";
}

export interface BillingGraph {
  invoiceId: string;
  nodes: BillingGraphNode[];
  edges: BillingGraphEdge[];
}

export interface BillingGraphPatch {
  appendNodes: BillingGraphNode[];
  appendEdges: BillingGraphEdge[];
}

export interface DraftInvoiceResponse {
  invoiceDraft: AgenticInvoiceDraft;
  participantSummary: ParticipantBillingSummary;
  guardrailDecision: GuardrailDecision;
  billingGraphPatch: BillingGraphPatch;
  requiresApproval: true;
}
