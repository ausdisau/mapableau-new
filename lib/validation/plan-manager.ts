import { z } from "zod";

export const invoiceReviewSchema = z.object({
  status: z.enum(["in_review", "needs_information", "approved", "rejected"]),
  notes: z.string().optional(),
});

export const disputeSchema = z.object({
  reason: z.string().min(1, "Please describe the dispute"),
});

export const paymentStatusSchema = z.object({
  reference: z.string().optional(),
  notes: z.string().optional(),
});
