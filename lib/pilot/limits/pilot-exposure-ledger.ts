import type { Prisma } from "@prisma/client";

import { assertNonNegativeCents } from "@/lib/ndis-gateway/billing/money";
import { sanitiseAuditJson } from "@/lib/ndis-gateway/security/log-sanitiser";
import { prisma } from "@/lib/prisma";

export async function appendExposureLedgerEntry(input: {
  pilotId: string;
  participantId?: string | null;
  entryType: string;
  amountCents: number;
  balanceAfterCents: number;
  reservationId?: string | null;
  correlationId?: string | null;
  safeMetadataJson?: Record<string, unknown>;
  db?: Prisma.TransactionClient | typeof prisma;
}) {
  const db = input.db ?? prisma;
  assertNonNegativeCents(input.balanceAfterCents, "balanceAfter");
  const safeMeta = sanitiseAuditJson(input.safeMetadataJson);
  return db.pilotExposureLedger.create({
    data: {
      pilotId: input.pilotId,
      participantId: input.participantId ?? null,
      entryType: input.entryType,
      amountCents: input.amountCents,
      balanceAfterCents: input.balanceAfterCents,
      reservationId: input.reservationId ?? null,
      correlationId: input.correlationId ?? null,
      safeMetadataJson: safeMeta
        ? (safeMeta as Prisma.InputJsonValue)
        : undefined,
    },
  });
}

export async function getLatestExposureBalance(pilotId: string): Promise<number> {
  const latest = await prisma.pilotExposureLedger.findFirst({
    where: { pilotId },
    orderBy: { occurredAt: "desc" },
  });
  return latest?.balanceAfterCents ?? 0;
}
