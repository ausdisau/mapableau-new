import type { XeroInvoicePayload } from "@/types/xero";

const SAFE_LINE = "Support services — see MapAble invoice for details";

export function mapInvoiceToXeroPayload(invoice: {
  id: string;
  invoiceNumber?: string | null;
  contactName: string;
  xeroContactId?: string;
  lines: Array<{
    description: string;
    quantity: number;
    unitAmountCents: number;
    xeroAccountCode?: string | null;
    xeroTaxType?: string | null;
  }>;
}): XeroInvoicePayload {
  return {
    Type: "ACCREC",
    Contact: invoice.xeroContactId
      ? { ContactID: invoice.xeroContactId }
      : { Name: invoice.contactName },
    Reference: invoice.invoiceNumber ?? invoice.id,
    Status: "DRAFT",
    LineItems: invoice.lines.map((l) => ({
      Description: SAFE_LINE,
      Quantity: l.quantity,
      UnitAmount: l.unitAmountCents / 100,
      AccountCode: l.xeroAccountCode ?? undefined,
      TaxType: l.xeroTaxType ?? undefined,
    })),
  };
}
