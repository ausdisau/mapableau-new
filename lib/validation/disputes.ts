import { z } from "zod";

export const disputeTypeSchema = z.enum([
  "invoice_dispute",
  "service_not_delivered",
  "no_show",
  "late_arrival",
  "wrong_worker_or_driver",
  "access_need_not_met",
  "overcharge_concern",
  "quality_concern",
]);

export const disputeStatusSchema = z.enum([
  "submitted",
  "under_review",
  "awaiting_provider_response",
  "resolved",
  "closed",
  "withdrawn",
]);

export const createDisputeSchema = z.object({
  type: disputeTypeSchema,
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  desiredOutcome: z.string().max(2000).optional(),
  bookingId: z.string().optional(),
  invoiceId: z.string().optional(),
  timesheetId: z.string().optional(),
  transportBookingId: z.string().optional(),
  billingInvoiceId: z.string().optional(),
  organisationId: z.string().optional(),
});

export const updateDisputeStatusSchema = z.object({
  status: disputeStatusSchema,
  resolutionSummary: z.string().max(5000).optional(),
  assignedAdminId: z.string().optional(),
});

export const disputeResponseSchema = z.object({
  body: z.string().min(1).max(5000),
});

export const complaintTypeSchema = z.enum([
  "unsafe_service",
  "privacy_concern",
  "discrimination_or_disrespect",
  "communication_issue",
  "provider_conduct",
  "worker_conduct",
  "platform_issue",
  "other",
]);

export const complaintStatusSchema = z.enum([
  "submitted",
  "under_review",
  "escalated_to_incident",
  "resolved",
  "closed",
]);

export const createComplaintSchema = z.object({
  type: complaintTypeSchema,
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  bookingId: z.string().optional(),
  invoiceId: z.string().optional(),
  timesheetId: z.string().optional(),
  organisationId: z.string().optional(),
});

export const updateComplaintStatusSchema = z.object({
  status: complaintStatusSchema,
  resolutionSummary: z.string().max(5000).optional(),
});

export const complaintResponseSchema = z.object({
  body: z.string().min(1).max(5000),
  isInternal: z.boolean().optional(),
});
