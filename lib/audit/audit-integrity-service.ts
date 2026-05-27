import { createHash } from "crypto";

import { prisma } from "@/lib/prisma";

export function computeRecordHash(payload: Record<string, unknown>, previousHash?: string | null): string {
  const canonical = JSON.stringify({ ...payload, previousHash: previousHash ?? null });
  return createHash("sha256").update(canonical).digest("hex");
}

export async function getLastAuditRecordHash(): Promise<string | null> {
  const last = await prisma.auditLog.findFirst({
    orderBy: { createdAt: "desc" },
    select: { recordHash: true },
  });
  return last?.recordHash ?? null;
}

export async function sealAuditIntegrityBatch(batchSize = 100): Promise<{ sealed: boolean; batchNumber?: number }> {
  const unbatched = await prisma.auditLog.findMany({
    where: { recordHash: { not: null } },
    orderBy: { createdAt: "asc" },
    take: batchSize,
    select: { id: true, recordHash: true, createdAt: true },
  });

  if (unbatched.length === 0) {
    return { sealed: false };
  }

  const lastBatch = await prisma.auditLogIntegrityBatch.findFirst({
    orderBy: { batchNumber: "desc" },
  });

  const batchNumber = (lastBatch?.batchNumber ?? 0) + 1;
  const hashes = unbatched.map((r) => r.recordHash).filter(Boolean) as string[];
  const batchHash = createHash("sha256").update(hashes.join("|")).digest("hex");

  await prisma.auditLogIntegrityBatch.create({
    data: {
      batchNumber,
      startLogId: unbatched[0]?.id,
      endLogId: unbatched[unbatched.length - 1]?.id,
      recordCount: unbatched.length,
      batchHash,
      previousBatchHash: lastBatch?.batchHash ?? null,
    },
  });

  return { sealed: true, batchNumber };
}

export async function verifyAuditChain(limit = 50): Promise<{ valid: boolean; checked: number }> {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      createdAt: true,
      previousHash: true,
      recordHash: true,
    },
  });

  let previousHash: string | null = null;
  for (const log of logs) {
    if (!log.recordHash) continue;
    const expected = computeRecordHash(
      {
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        createdAt: log.createdAt.toISOString(),
      },
      previousHash
    );
    if (log.previousHash !== previousHash) {
      return { valid: false, checked: logs.length };
    }
    previousHash = log.recordHash;
  }

  return { valid: true, checked: logs.length };
}
