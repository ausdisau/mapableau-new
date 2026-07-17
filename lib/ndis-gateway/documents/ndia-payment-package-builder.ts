import { sumCents } from "@/lib/ndis-gateway/billing/money";
import type {
  RenderableDocument,
  RenderableDocumentLine,
} from "@/lib/ndis-gateway/documents/document-renderer";

/**
 * Build an NDIA payment request package document (export-oriented).
 * Does not mark submitted.
 */
export function buildNdiaPaymentPackage(input: {
  documentNumber: string;
  organisationName: string;
  providerRegistrationNumber: string | null;
  lines: RenderableDocumentLine[];
  issueDate?: Date;
}): RenderableDocument {
  if (input.lines.length === 0) {
    throw new Error("NDIA_PACKAGE_LINES_REQUIRED");
  }
  const subtotalCents = sumCents(input.lines.map((l) => l.totalCents));
  return {
    documentKind: "ndia_payment_request_package",
    documentNumber: input.documentNumber,
    organisationName: input.organisationName,
    participantId: null,
    billingRoute: "ndis_ndia_managed",
    currency: "AUD",
    issueDate: (input.issueDate ?? new Date()).toISOString(),
    lines: input.lines,
    subtotalCents,
    gstCents: 0,
    totalCents: subtotalCents,
    notes: [
      "Portal-assisted export only. MapAble does not submit to NDIA on your behalf.",
      input.providerRegistrationNumber
        ? `Provider registration on file: present`
        : "Provider registration number missing — package may be blocked at dispatch.",
    ],
  };
}
