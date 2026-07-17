import type {
  DelegateAuthorityStatus,
  DelegateAuthorityTransaction,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

export interface RecordAuthorityTransactionInput {
  authorityId: string;
  actorId?: string | null;
  transactionKind: string;
  fromStatus?: DelegateAuthorityStatus | null;
  toStatus: DelegateAuthorityStatus;
  reason?: string | null;
  evidence?: Record<string, unknown>;
}

export async function recordAuthorityTransaction(
  input: RecordAuthorityTransactionInput
): Promise<DelegateAuthorityTransaction> {
  return prisma.delegateAuthorityTransaction.create({
    data: {
      authorityId: input.authorityId,
      actorId: input.actorId ?? null,
      transactionKind: input.transactionKind,
      fromStatus: input.fromStatus ?? null,
      toStatus: input.toStatus,
      reason: input.reason ?? null,
      evidence: asJson(input.evidence),
    },
  });
}

export async function listAuthorityTransactions(authorityId: string) {
  return prisma.delegateAuthorityTransaction.findMany({
    where: { authorityId },
    orderBy: { createdAt: "asc" },
  });
}
