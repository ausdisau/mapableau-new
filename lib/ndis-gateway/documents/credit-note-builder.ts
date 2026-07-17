import { sumCents } from "@/lib/ndis-gateway/billing/money";
import type {
  RenderableDocument,
  RenderableDocumentLine,
} from "@/lib/ndis-gateway/documents/document-renderer";

export function buildCreditNote(input: {
  documentNumber: string;
  organisationName: string;
  participantId: string | null;
  billingRoute: string;
  lines: RenderableDocumentLine[];
  originalDocumentNumber?: string | null;
  reason: string;
  issueDate?: Date;
}): RenderableDocument {
  if (!input.reason.trim()) {
    throw new Error("CREDIT_NOTE_REASON_REQUIRED");
  }
  if (input.lines.length === 0) {
    throw new Error("CREDIT_NOTE_LINES_REQUIRED");
  }
  // Credit amounts stored as positive cents with document kind credit_note.
  const subtotalCents = sumCents(input.lines.map((l) => l.totalCents));
  return {
    documentKind: "credit_note",
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
    notes: [
      `Credit reason: ${input.reason.trim()}`,
      ...(input.originalDocumentNumber
        ? [`Supersedes/credits: ${input.originalDocumentNumber}`]
        : []),
    ],
  };
}
