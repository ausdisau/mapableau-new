import type { XeroInvoicePayload } from "@/types/invoices";

type InvoiceWithRelations = {
  id: string;
  invoiceNumber: string | null;
  status: string;
  issueDate: Date | null;
  dueDate: Date | null;
  issuedAt: Date | null;
  participant: { name: string; email: string };
  bookingId: string | null;
  lines: Array<{
    description: string;
    quantity: unknown;
    unitAmountCents: number;
    supportItemCode?: string | null;
    gstApplicable: boolean;
    ndisSupportCategory?: string | null;
  }>;
};

/**
 * Maps a MapAble invoice to a Xero ACCREC payload.
 * Live OAuth + POST to Xero API will be added in a later phase.
 */
export function mapInvoiceToXeroPayload(
  invoice: InvoiceWithRelations,
  options?: { accountCode?: string; redactDescriptions?: boolean }
): XeroInvoicePayload {
  const accountCode = options?.accountCode ?? "200";
  const issueDate = invoice.issuedAt ?? invoice.issueDate ?? new Date();
  const dueDate =
    invoice.dueDate ??
    new Date(issueDate.getTime() + 14 * 24 * 60 * 60 * 1000);

  const xeroStatus =
    invoice.status === "draft"
      ? "DRAFT"
      : invoice.status === "paid"
        ? "AUTHORISED"
        : "SUBMITTED";

  return {
    type: "ACCREC",
    contact: {
      name: invoice.participant.name,
      email: invoice.participant.email,
    },
    invoiceNumber: invoice.invoiceNumber ?? invoice.id,
    date: issueDate.toISOString().slice(0, 10),
    dueDate: dueDate.toISOString().slice(0, 10),
    lineItems: invoice.lines.map((line) => ({
      description: options?.redactDescriptions
        ? "Support services — details in MapAble"
        : line.description,
      quantity: Number(line.quantity),
      unitAmount: line.unitAmountCents / 100,
      accountCode,
      taxType: line.gstApplicable ? "OUTPUT" : "EXEMPTOUTPUT",
    })),
    reference: invoice.bookingId ?? invoice.id,
    status: xeroStatus,
  };
}

// Placeholders for future OAuth integration:
// XERO_CLIENT_ID, XERO_CLIENT_SECRET, XERO_TENANT_ID
