import type { Invoice, InvoiceLineItem, FundingSource } from "@prisma/client";
import { format } from "date-fns";


type InvoiceWithRelations = Invoice & {
  lineItems: InvoiceLineItem[];
  fundingSource: FundingSource | null;
};

export function invoiceToCsv(invoice: InvoiceWithRelations): string {
  const headers = [
    "invoice_id",
    "user_id",
    "provider_id",
    "booking_id",
    "service_type",
    "status",
    "currency",
    "subtotal_cents",
    "gst_cents",
    "platform_fee_cents",
    "total_cents",
    "ndis_line_item",
    "ndis_claimable",
    "due_at",
    "created_at",
  ];

  const row = [
    invoice.id,
    invoice.userId,
    invoice.providerId ?? "",
    invoice.bookingId ?? "",
    invoice.serviceType,
    invoice.status,
    invoice.currency,
    String(invoice.subtotalCents),
    String(invoice.gstCents),
    String(invoice.platformFeeCents),
    String(invoice.totalCents),
    invoice.ndisLineItem ?? "",
    String(invoice.ndisClaimable),
    invoice.dueAt ? format(invoice.dueAt, "yyyy-MM-dd") : "",
    format(invoice.createdAt, "yyyy-MM-dd'T'HH:mm:ssXXX"),
  ];

  const lineHeaders = [
    "line_description",
    "line_quantity",
    "line_unit_amount_cents",
    "line_total_cents",
    "line_ndis_item",
    "line_gst_applicable",
  ];

  const lines = invoice.lineItems.map((li) =>
    [
      li.description,
      String(li.quantity),
      String(li.unitAmountCents),
      String(li.totalCents),
      li.ndisLineItem ?? "",
      String(li.gstApplicable),
    ].join(",")
  );

  return [
    headers.join(","),
    row.join(","),
    "",
    lineHeaders.join(","),
    ...lines,
  ].join("\n");
}

export function invoiceToPlanManagerPayload(invoice: InvoiceWithRelations) {
  return {
    invoiceId: invoice.id,
    participantUserId: invoice.userId,
    planManager: invoice.fundingSource
      ? {
          name: invoice.fundingSource.planManagerName,
          email: invoice.fundingSource.planManagerEmail,
          participantNumber: invoice.fundingSource.ndisParticipantNumber,
        }
      : null,
    serviceType: invoice.serviceType,
    currency: invoice.currency,
    amounts: {
      subtotalCents: invoice.subtotalCents,
      gstCents: invoice.gstCents,
      platformFeeCents: invoice.platformFeeCents,
      totalCents: invoice.totalCents,
    },
    ndis: {
      lineItem: invoice.ndisLineItem,
      claimable: invoice.ndisClaimable,
    },
    dueAt: invoice.dueAt?.toISOString() ?? null,
    lineItems: invoice.lineItems.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unitAmountCents: li.unitAmountCents,
      totalCents: li.totalCents,
      ndisLineItem: li.ndisLineItem,
    })),
    message:
      "Please process this NDIS plan-managed invoice. Payment is not collected via Stripe.",
  };
}
