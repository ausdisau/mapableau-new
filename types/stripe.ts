import { z } from "zod";

export type StripePaymentRecord = {
  id: string;
  invoiceId: string;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  amountCents: number;
  currency: string;
  status: string;
  paidAt?: string | null;
};

export const checkoutSessionSchema = z.object({
  invoiceId: z.string().min(1),
  amountCents: z.number().int().positive().optional(),
  successPath: z.string().optional(),
  cancelPath: z.string().optional(),
});

export type BillingEventStripe =
  | "checkout.session.completed"
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  | "invoice.paid"
  | "invoice.payment_failed"
  | "charge.refunded";
