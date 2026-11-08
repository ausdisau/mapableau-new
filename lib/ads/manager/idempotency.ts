import { createHash } from "node:crypto";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export function hashRequestPayload(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export type IdempotencyLookup = {
  scope: string;
  idempotencyKey: string;
  advertiserId?: string | null;
  requestHash: string;
};

export async function findIdempotentResponse(lookup: IdempotencyLookup) {
  const existing = await prisma.adManagerIdempotencyRecord.findUnique({
    where: {
      scope_idempotencyKey: {
        scope: lookup.scope,
        idempotencyKey: lookup.idempotencyKey,
      },
    },
  });
  if (!existing) return null;
  if (existing.requestHash !== lookup.requestHash) {
    return { conflict: true as const };
  }
  return {
    conflict: false as const,
    status: existing.responseStatus,
    body: existing.responseBody,
  };
}

export async function storeIdempotentResponse(
  lookup: IdempotencyLookup,
  responseStatus: number,
  responseBody: Prisma.InputJsonValue,
) {
  return prisma.adManagerIdempotencyRecord.create({
    data: {
      scope: lookup.scope,
      idempotencyKey: lookup.idempotencyKey,
      advertiserId: lookup.advertiserId ?? null,
      requestHash: lookup.requestHash,
      responseStatus,
      responseBody,
    },
  });
}
