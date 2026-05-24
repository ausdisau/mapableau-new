import { z } from "zod";

export type XeroConnection = {
  id: string;
  organisationId: string;
  tenantId: string;
  tenantName?: string | null;
  status: string;
  expiresAt?: string | null;
};

export type XeroInvoiceSync = {
  id: string;
  invoiceId: string;
  xeroInvoiceId?: string | null;
  syncStatus: string;
  payloadHash?: string | null;
  attemptNumber: number;
  lastError?: string | null;
  syncedAt?: string | null;
};

export type XeroInvoicePayload = {
  Type: "ACCREC";
  Contact: { ContactID?: string; Name?: string };
  LineItems: Array<{
    Description: string;
    Quantity: number;
    UnitAmount: number;
    AccountCode?: string;
    TaxType?: string;
  }>;
  Reference: string;
  Status: "DRAFT" | "SUBMITTED" | "AUTHORISED";
};

export const xeroDisconnectSchema = z.object({
  organisationId: z.string().min(1),
  mfaConfirmed: z.boolean().optional(),
});
