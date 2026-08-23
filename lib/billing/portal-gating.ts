import type { BillingFundingSourceType } from "@prisma/client";

import { stripeCheckoutAllowed } from "@/lib/billing/core/funding-logic";
import { isTransitionAllowed } from "@/lib/billing/invoicing/state-machine";
import type { BillingInvoiceState } from "@/types/billing";

export const PAYABLE_INVOICE_STATUSES: readonly BillingInvoiceState[] = [
  "draft",
  "issued",
  "sent",
  "pending_payment",
  "failed",
  "overdue",
];

export const SETTLED_INVOICE_STATUSES: readonly BillingInvoiceState[] = [
  "paid",
  "credited",
  "refunded",
  "void",
  "cancelled",
  "written_off",
];

export function isInvoicePayable(
  status: string,
  fundingType: BillingFundingSourceType | null | undefined
): boolean {
  return (
    stripeCheckoutAllowed(fundingType) &&
    PAYABLE_INVOICE_STATUSES.includes(status as BillingInvoiceState)
  );
}

export function isInvoiceSettled(status: string): boolean {
  return SETTLED_INVOICE_STATUSES.includes(status as BillingInvoiceState);
}

export function canIssueInvoiceFromStatus(status: string): boolean {
  return status === "approved" || status === "ready_to_issue";
}

export function canSendInvoiceFromStatus(status: string): boolean {
  return status === "issued";
}

export function canVoidInvoiceFromStatus(status: string): boolean {
  return isTransitionAllowed(status as BillingInvoiceState, "void");
}
