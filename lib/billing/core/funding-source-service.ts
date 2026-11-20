import type { BillingFundingSourceType, Prisma } from "@prisma/client";
import type { z } from "zod";

import { writeBillingAuditLog } from "@/lib/billing/core/audit";
import type { createFundingSourceSchema } from "@/lib/billing/core/schemas";
import { prisma } from "@/lib/prisma";

type CreateInput = z.infer<typeof createFundingSourceSchema>;
type DbClient = Prisma.TransactionClient | typeof prisma;

export async function listFundingSources(userId: string, db: DbClient = prisma) {
  return db.billingFundingSource.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function createFundingSource(
  userId: string,
  input: CreateInput,
  db: DbClient = prisma,
) {
  if (input.isDefault) {
    await db.billingFundingSource.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const source = await db.billingFundingSource.create({
    data: {
      userId,
      type: input.type as BillingFundingSourceType,
      label: input.label,
      ndisParticipantNumber: input.ndisParticipantNumber,
      planManagerName: input.planManagerName,
      planManagerEmail: input.planManagerEmail,
      isDefault: input.isDefault ?? false,
      metadata: input.metadata as object | undefined,
    },
  });

  // Audit outside the caller's transaction would race; write after create using
  // the same client so a rolled-back create cannot leave an orphan audit row.
  await writeBillingAuditLog(
    {
      actorUserId: userId,
      entityType: "BillingFundingSource",
      entityId: source.id,
      action: "created",
      after: source,
    },
    db,
  );

  return source;
}
