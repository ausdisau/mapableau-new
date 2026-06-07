import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export type RemittanceCsvRow = {
  externalClaimId?: string;
  claimId?: string;
  participantRef?: string;
  amountCents: number;
  paymentDate?: Date;
  raw: Record<string, string>;
};

function parseAmountCents(value: string | undefined): number {
  if (!value?.trim()) return 0;
  const normalized = value.replace(/[$,\s]/g, "");
  const dollars = Number.parseFloat(normalized);
  if (Number.isNaN(dollars)) return 0;
  return Math.round(dollars * 100);
}

function parseCsv(content: string): Record<string, string>[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = cells[i] ?? "";
    });
    return row;
  });
}

export function parseRemittanceCsv(content: string): RemittanceCsvRow[] {
  return parseCsv(content).map((raw) => {
    const externalClaimId =
      raw.externalclaimid ||
      raw.claim_id ||
      raw.claimid ||
      raw["ndia claim id"] ||
      undefined;
    const claimId = raw.mapableclaimid || raw.internalclaimid || undefined;
    const participantRef =
      raw.participant || raw.participantnumber || raw.ndisnumber || undefined;
    const amountCents = parseAmountCents(
      raw.amount || raw.paidamount || raw.total || raw.paymentamount
    );
    const paymentDateRaw =
      raw.paymentdate || raw.paiddate || raw.date || undefined;
    const paymentDate = paymentDateRaw ? new Date(paymentDateRaw) : undefined;

    return {
      externalClaimId: externalClaimId || undefined,
      claimId: claimId || undefined,
      participantRef: participantRef || undefined,
      amountCents,
      paymentDate:
        paymentDate && !Number.isNaN(paymentDate.getTime())
          ? paymentDate
          : undefined,
      raw,
    };
  });
}

async function matchRemittanceLine(
  organisationId: string,
  row: RemittanceCsvRow
): Promise<{ matchStatus: string; claimId?: string }> {
  if (row.claimId) {
    const claim = await prisma.ndiaProviderClaim.findFirst({
      where: { id: row.claimId, organisationId },
    });
    if (claim) {
      return { matchStatus: "matched", claimId: claim.id };
    }
    return { matchStatus: "claim_not_found" };
  }

  if (row.externalClaimId) {
    const claim = await prisma.ndiaProviderClaim.findFirst({
      where: { externalClaimId: row.externalClaimId, organisationId },
    });
    if (claim) {
      return { matchStatus: "matched", claimId: claim.id };
    }
    return { matchStatus: "external_not_found" };
  }

  return { matchStatus: "unmatched" };
}

export async function importNdiaRemittanceCsv(params: {
  organisationId: string;
  importedById: string;
  fileName: string;
  csvContent: string;
}) {
  const rows = parseRemittanceCsv(params.csvContent);
  if (rows.length === 0) {
    throw new Error("EMPTY_REMITTANCE_FILE");
  }

  let matched = 0;
  let unmatched = 0;

  const importRecord = await prisma.ndiaRemittanceImport.create({
    data: {
      organisationId: params.organisationId,
      fileName: params.fileName,
      importedById: params.importedById,
      status: "completed",
      summaryJson: { rowCount: rows.length },
    },
  });

  for (const row of rows) {
    const match = await matchRemittanceLine(params.organisationId, row);
    if (match.matchStatus === "matched") matched++;
    else unmatched++;

    await prisma.ndiaRemittanceLine.create({
      data: {
        importId: importRecord.id,
        externalClaimId: row.externalClaimId,
        claimId: match.claimId ?? row.claimId,
        participantRef: row.participantRef,
        amountCents: row.amountCents,
        paymentDate: row.paymentDate,
        matchStatus: match.matchStatus,
        rawRowJson: row.raw,
      },
    });

    if (match.matchStatus === "matched" && match.claimId) {
      await prisma.ndiaProviderClaim.update({
        where: { id: match.claimId },
        data: { status: "paid", paidAt: row.paymentDate ?? new Date() },
      });
    }
  }

  const summaryJson = {
    rowCount: rows.length,
    matched,
    unmatched,
  };

  await prisma.ndiaRemittanceImport.update({
    where: { id: importRecord.id },
    data: { summaryJson },
  });

  await createAuditEvent({
    actorUserId: params.importedById,
    action: "ndia.remittance_imported",
    entityType: "NdiaRemittanceImport",
    entityId: importRecord.id,
    organisationId: params.organisationId,
    metadata: summaryJson,
  });

  return prisma.ndiaRemittanceImport.findUnique({
    where: { id: importRecord.id },
    include: { lines: true },
  });
}

export async function listNdiaRemittanceImports(organisationId: string) {
  return prisma.ndiaRemittanceImport.findMany({
    where: { organisationId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { lines: { take: 5 } },
  });
}
