import type { NdisBillingDocument } from "@prisma/client";

export type SafeBillingDocumentView = {
  id: string;
  organisationId: string;
  participantId: string | null;
  billingRoute: string;
  documentKind: string;
  documentNumber: string;
  status: string;
  issueDate: string | null;
  dueDate: string | null;
  currency: string;
  subtotalCents: number;
  gstCents: number;
  totalCents: number;
  contentHash: string;
  dispatchStatus: string;
  billingBatchId: string | null;
  createdAt: string;
};

export function projectBillingDocumentSafe(
  doc: NdisBillingDocument
): SafeBillingDocumentView {
  return {
    id: doc.id,
    organisationId: doc.organisationId,
    participantId: doc.participantId,
    billingRoute: doc.billingRoute,
    documentKind: doc.documentKind,
    documentNumber: doc.documentNumber,
    status: doc.status,
    issueDate: doc.issueDate?.toISOString() ?? null,
    dueDate: doc.dueDate?.toISOString() ?? null,
    currency: doc.currency,
    subtotalCents: doc.subtotalCents,
    gstCents: doc.gstCents,
    totalCents: doc.totalCents,
    contentHash: doc.contentHash,
    dispatchStatus: doc.dispatchStatus,
    billingBatchId: doc.billingBatchId,
    createdAt: doc.createdAt.toISOString(),
  };
}
