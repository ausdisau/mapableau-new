import type { NdisDocumentKind, Prisma, PrismaClient } from "@prisma/client";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

/**
 * Australian financial year (July–June), labelled by ending calendar year.
 * e.g. 15 Jul 2025 → 2026; 30 Jun 2026 → 2026; 1 Jul 2026 → 2027.
 */
export function australianFinancialYear(date: Date = new Date()): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // 0-based
  return month >= 6 ? year + 1 : year;
}

export function formatDocumentNumber(
  prefix: string,
  financialYear: number,
  sequence: number
): string {
  const padded = String(sequence).padStart(6, "0");
  return `${prefix}-${financialYear}-${padded}`;
}

export function prefixForDocumentKind(kind: NdisDocumentKind): string {
  switch (kind) {
    case "self_managed_invoice":
      return "MAP-SM";
    case "plan_manager_invoice":
      return "MAP-PM";
    case "private_pay_invoice":
      return "MAP-PP";
    case "ndia_payment_request_package":
      return "MAP-NDIA";
    case "credit_note":
    case "adjustment_note":
      return "MAP-CR";
    case "portal_bulk_upload":
      return "MAP-BATCH";
    case "service_statement":
    case "evidence_summary":
    case "remittance_advice":
    case "receipt":
      return "MAP-INV";
    default: {
      const _exhaustive: never = kind;
      void _exhaustive;
      return "MAP-INV";
    }
  }
}

/**
 * Concurrency-safe sequence allocation inside a transaction.
 * Uses upsert + increment on BillingNumberSequence.
 */
export async function allocateDocumentNumber(input: {
  organisationId: string;
  documentKind: NdisDocumentKind;
  prefix?: string;
  financialYear?: number;
  tx: TxClient | Prisma.TransactionClient;
}): Promise<{ documentNumber: string; sequence: number; financialYear: number }> {
  const financialYear = input.financialYear ?? australianFinancialYear();
  const prefix = input.prefix ?? prefixForDocumentKind(input.documentKind);
  const tx = input.tx;

  const existing = await tx.billingNumberSequence.findUnique({
    where: {
      organisationId_documentKind_financialYear: {
        organisationId: input.organisationId,
        documentKind: input.documentKind,
        financialYear,
      },
    },
  });

  if (!existing) {
    const created = await tx.billingNumberSequence.create({
      data: {
        organisationId: input.organisationId,
        documentKind: input.documentKind,
        financialYear,
        nextNumber: 2,
        prefix,
      },
    });
    return {
      documentNumber: formatDocumentNumber(prefix, financialYear, 1),
      sequence: 1,
      financialYear: created.financialYear,
    };
  }

  const updated = await tx.billingNumberSequence.update({
    where: { id: existing.id },
    data: { nextNumber: { increment: 1 } },
  });
  const sequence = updated.nextNumber - 1;
  return {
    documentNumber: formatDocumentNumber(existing.prefix || prefix, financialYear, sequence),
    sequence,
    financialYear,
  };
}

/** Allocate MAP-BATCH-YYYY-###### style batch reference (no Prisma tx required wrapper). */
export async function allocateBatchReference(
  organisationId: string,
  tx: TxClient | Prisma.TransactionClient
): Promise<string> {
  const result = await allocateDocumentNumber({
    organisationId,
    documentKind: "portal_bulk_upload",
    prefix: "MAP-BATCH",
    tx,
  });
  return result.documentNumber;
}
