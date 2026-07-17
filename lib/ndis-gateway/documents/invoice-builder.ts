import type { NdisBillingRoute, NdisDocumentKind } from "@prisma/client";

import { sumCents } from "@/lib/ndis-gateway/billing/money";
import type {
  RenderableDocument,
  RenderableDocumentLine,
} from "@/lib/ndis-gateway/documents/document-renderer";

export type InvoiceBuilderLine = RenderableDocumentLine & {
  billableItemId: string;
};

export function documentKindForBillingRoute(
  route: NdisBillingRoute
): NdisDocumentKind {
  switch (route) {
    case "ndis_self_managed":
      return "self_managed_invoice";
    case "ndis_plan_managed":
      return "plan_manager_invoice";
    case "private_pay":
      return "private_pay_invoice";
    case "ndis_ndia_managed":
      return "ndia_payment_request_package";
    default:
      return "service_statement";
  }
}

export function buildInvoiceDocument(input: {
  documentNumber: string;
  organisationName: string;
  participantId: string | null;
  billingRoute: NdisBillingRoute;
  lines: InvoiceBuilderLine[];
  issueDate?: Date;
  notes?: string[];
}): RenderableDocument {
  if (input.lines.length === 0) {
    throw new Error("INVOICE_LINES_REQUIRED");
  }

  const participantIds = new Set(
    input.lines.map(() => input.participantId).filter(Boolean)
  );
  if (
    (input.billingRoute === "ndis_self_managed" ||
      input.billingRoute === "ndis_plan_managed" ||
      input.billingRoute === "private_pay") &&
    !input.participantId
  ) {
    throw new Error("INVOICE_PARTICIPANT_REQUIRED");
  }
  void participantIds;

  const subtotalCents = sumCents(input.lines.map((l) => l.totalCents));
  return {
    documentKind: documentKindForBillingRoute(input.billingRoute),
    documentNumber: input.documentNumber,
    organisationName: input.organisationName,
    participantId: input.participantId,
    billingRoute: input.billingRoute,
    currency: "AUD",
    issueDate: (input.issueDate ?? new Date()).toISOString(),
    lines: input.lines,
    subtotalCents,
    gstCents: 0,
    totalCents: subtotalCents,
    notes: input.notes,
  };
}
