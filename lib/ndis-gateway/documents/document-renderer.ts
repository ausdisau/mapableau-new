import type { NdisDocumentKind } from "@prisma/client";

export type RenderableDocumentLine = {
  supportItemCode: string | null;
  description: string;
  serviceStartAt: string;
  serviceEndAt: string;
  quantity: string;
  unitType: string;
  unitPriceCents: number;
  totalCents: number;
};

export type RenderableDocument = {
  documentKind: NdisDocumentKind;
  documentNumber: string;
  organisationName: string;
  participantId: string | null;
  billingRoute: string;
  currency: string;
  issueDate: string;
  lines: RenderableDocumentLine[];
  subtotalCents: number;
  gstCents: number;
  totalCents: number;
  notes?: string[];
};

/** Deterministic text renderer for packages / checksums (not a PDF engine). */
export function renderDocumentPlainText(doc: RenderableDocument): string {
  const lines = [
    `Document: ${doc.documentNumber}`,
    `Kind: ${doc.documentKind}`,
    `Organisation: ${doc.organisationName}`,
    `Route: ${doc.billingRoute}`,
    `Issue: ${doc.issueDate}`,
    `Currency: ${doc.currency}`,
    "",
    "Lines:",
    ...doc.lines.map(
      (l, i) =>
        `${i + 1}. ${l.supportItemCode ?? "-"} | ${l.description} | ${l.serviceStartAt.slice(0, 10)} | qty ${l.quantity} ${l.unitType} @ ${l.unitPriceCents}c = ${l.totalCents}c`
    ),
    "",
    `Subtotal: ${doc.subtotalCents}c`,
    `GST: ${doc.gstCents}c`,
    `Total: ${doc.totalCents}c`,
    ...(doc.notes?.length ? ["", "Notes:", ...doc.notes] : []),
  ];
  return lines.join("\n");
}

export function renderDocumentSafeJson(doc: RenderableDocument): Record<string, unknown> {
  return {
    documentNumber: doc.documentNumber,
    documentKind: doc.documentKind,
    organisationName: doc.organisationName,
    participantId: doc.participantId,
    billingRoute: doc.billingRoute,
    currency: doc.currency,
    issueDate: doc.issueDate,
    lines: doc.lines.map((l) => ({
      supportItemCode: l.supportItemCode,
      description: l.description,
      serviceStartAt: l.serviceStartAt,
      serviceEndAt: l.serviceEndAt,
      quantity: l.quantity,
      unitType: l.unitType,
      unitPriceCents: l.unitPriceCents,
      totalCents: l.totalCents,
    })),
    subtotalCents: doc.subtotalCents,
    gstCents: doc.gstCents,
    totalCents: doc.totalCents,
    notes: doc.notes ?? [],
  };
}
