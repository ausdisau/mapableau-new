import { createHmac, randomBytes } from "node:crypto";

import type { PairwiseSubjectIdentifier } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Pairwise Subject Identifiers.
 *
 * A raw MapAble user id, email, or NDIS number MUST NEVER be handed to an
 * external verifier or issuer as the subject identifier of a credential or
 * presentation. Doing so would let colluding verifiers correlate a
 * participant across services.
 *
 * `mintPairwiseSubjectId` returns (and persists) a per-(participant, entity)
 * opaque identifier. The salt is process-scoped so that multiple environments
 * produce different identifiers for the same tuple.
 */

const PAIRWISE_SECRET =
  process.env.FEDERATION_PAIRWISE_SECRET ??
  // Deterministic per process to keep dev/test stable. Prod must set the env.
  createHmacFromRandom();

function createHmacFromRandom(): string {
  return randomBytes(32).toString("hex");
}

export function computePairwiseSubjectId(input: {
  participantId: string;
  entityId: string;
}): string {
  return createHmac("sha256", PAIRWISE_SECRET)
    .update(`${input.participantId}::${input.entityId}`)
    .digest("hex");
}

export async function mintPairwiseSubjectId(input: {
  participantId: string;
  entityId: string;
}): Promise<PairwiseSubjectIdentifier> {
  const pairwiseSub = computePairwiseSubjectId(input);
  return prisma.pairwiseSubjectIdentifier.upsert({
    where: {
      participantId_entityId: {
        participantId: input.participantId,
        entityId: input.entityId,
      },
    },
    create: {
      participantId: input.participantId,
      entityId: input.entityId,
      pairwiseSub,
      algorithm: "HMAC-SHA-256",
    },
    update: {},
  });
}

/**
 * Prohibited subject identifiers — the API layer feeds candidate subjects
 * through this filter to fail fast on accidental raw-ID leakage.
 */
const RAW_ID_PATTERNS = [
  /^u_[a-z0-9]+$/i,
  /^user_[a-z0-9]+$/i,
  /@/,
  /^\d{9,11}$/,
];

export function isProhibitedRawSubject(candidate: string): boolean {
  return RAW_ID_PATTERNS.some((rx) => rx.test(candidate));
}
