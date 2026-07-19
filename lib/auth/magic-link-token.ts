import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

export const MAGIC_LINK_PURPOSE = "credentials-magic-link" as const;

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/** Exported for tests — never log or persist the raw token. */
export function hashMagicLinkToken(rawToken: string): string {
  return hashToken(rawToken);
}

export async function issueMagicLinkToken(input: {
  userId: string;
  purpose?: string;
  ttlSeconds?: number;
}): Promise<{ rawToken: string; expiresAt: Date; tokenHash: string }> {
  const purpose = input.purpose ?? MAGIC_LINK_PURPOSE;
  const ttlSeconds = input.ttlSeconds ?? 15 * 60;
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);

  await prisma.$transaction(async (tx) => {
    await tx.magicLinkToken.updateMany({
      where: {
        userId: input.userId,
        purpose,
        consumedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    await tx.magicLinkToken.create({
      data: {
        userId: input.userId,
        purpose,
        tokenHash,
        expiresAt,
      },
    });
  });

  return { rawToken, expiresAt, tokenHash };
}

/**
 * Atomically consume a one-time magic-link token.
 * Returns the userId on success, or null when invalid/expired/replayed/revoked.
 */
export async function consumeMagicLinkToken(rawToken: string): Promise<{
  userId: string;
  purpose: string;
} | null> {
  if (!rawToken || rawToken.length < 16) return null;
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const row = await tx.magicLinkToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        purpose: true,
        expiresAt: true,
        consumedAt: true,
        revokedAt: true,
      },
    });

    if (!row) return null;
    if (row.consumedAt || row.revokedAt) return null;
    if (row.expiresAt.getTime() <= now.getTime()) return null;

    const updated = await tx.magicLinkToken.updateMany({
      where: {
        id: row.id,
        consumedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { consumedAt: now },
    });

    if (updated.count !== 1) return null;
    return { userId: row.userId, purpose: row.purpose };
  });
}

export async function cleanupExpiredMagicLinkTokens(
  olderThanDays = 7,
): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const result = await prisma.magicLinkToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: cutoff } },
        { consumedAt: { not: null, lt: cutoff } },
        { revokedAt: { not: null, lt: cutoff } },
      ],
    },
  });
  return result.count;
}
