import type { PlanManagerExportRow } from "@/lib/plan-manager/export-service";

export type BillingPlanManagerExportPayload = {
  invoiceId: string;
  participantUserId: string;
  planManager: {
    name?: string | null;
    email?: string | null;
  };
  ndisParticipantNumber?: string | null;
  currency: string;
  totalCents: number;
  dueAt: string | null;
  lineItems: {
    description: string;
    quantity: number;
    unitAmountCents: number;
    totalCents: number;
    ndisLineItem?: string | null;
  }[];
  emailSubject: string;
  emailBody: string;
};

type BillingInvoiceExportShape = {
  id: string;
  userId: string;
  currency: string;
  subtotalCents: number;
  gstCents: number;
  totalCents: number;
  status: string;
  dueAt: Date | null;
  fundingSource: {
    planManagerName?: string | null;
    planManagerEmail?: string | null;
    ndisParticipantNumber?: string | null;
  } | null;
  lineItems: {
    description: string;
    quantity: unknown;
    unitAmountCents: number;
    totalCents: number;
    ndisLineItem?: string | null;
  }[];
};

/**
 * Canonical plan-manager export shape for billing-core invoices.
 * Y2 export API uses legacy Invoice rows; billing-core uses this payload only.
 */
export function buildBillingPlanManagerPayload(
  invoice: BillingInvoiceExportShape
): BillingPlanManagerExportPayload {
  return {
    invoiceId: invoice.id,
    participantUserId: invoice.userId,
    planManager: {
      name: invoice.fundingSource?.planManagerName,
      email: invoice.fundingSource?.planManagerEmail,
    },
    ndisParticipantNumber: invoice.fundingSource?.ndisParticipantNumber,
    currency: invoice.currency,
    totalCents: invoice.totalCents,
    dueAt: invoice.dueAt?.toISOString() ?? null,
    lineItems: invoice.lineItems.map((li) => ({
      description: li.description,
      quantity: Number(li.quantity),
      unitAmountCents: li.unitAmountCents,
      totalCents: li.totalCents,
      ndisLineItem: li.ndisLineItem,
    })),
    emailSubject: `NDIS invoice ${invoice.id.slice(0, 8)} — ${invoice.totalCents / 100} ${invoice.currency}`,
    emailBody:
      "Please find the attached plan-managed invoice details for payment processing.",
  };
}

export function billingPayloadToPlanManagerRow(
  invoice: BillingInvoiceExportShape
): PlanManagerExportRow {
  return {
    invoiceId: invoice.id,
    participantRef: invoice.userId,
    status: invoice.status,
    subtotalCents: invoice.subtotalCents,
    taxCents: invoice.gstCents,
    totalCents: invoice.totalCents,
    lineItems: invoice.lineItems.map((li) => ({
      description: li.description,
      quantity: String(li.quantity),
      unitAmountCents: li.unitAmountCents,
      totalAmountCents: li.totalCents,
    })),
  };
}
