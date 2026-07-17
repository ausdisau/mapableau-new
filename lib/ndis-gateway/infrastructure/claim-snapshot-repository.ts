import type { NdisClaimSnapshot, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CreateSnapshotRecordInput = {
  organisationId: string;
  participantId?: string | null;
  sourceType: Prisma.NdisClaimSnapshotCreateInput["sourceType"];
  sourceId: string;
  sourceVersion?: string | null;
  schemaVersion: string;
  maskedPayloadJson: Prisma.InputJsonValue;
  encryptedPayloadCiphertext: string;
  payloadHash: string;
  encryptionKeyVersion: string;
  pricingReleaseId?: string | null;
  supportItemCodes: string[];
  totalCents: number;
  currency: string;
  fundingRoute?: string | null;
  createdById: string;
  privacyReviewRequired?: boolean;
};

/**
 * Snapshots are append-only. Only supersededAt / supersededById may change.
 */
export async function insertClaimSnapshot(
  input: CreateSnapshotRecordInput
): Promise<NdisClaimSnapshot> {
  return prisma.ndisClaimSnapshot.create({
    data: {
      organisationId: input.organisationId,
      participantId: input.participantId ?? undefined,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      sourceVersion: input.sourceVersion ?? undefined,
      schemaVersion: input.schemaVersion,
      maskedPayloadJson: input.maskedPayloadJson,
      encryptedPayloadCiphertext: input.encryptedPayloadCiphertext,
      payloadHash: input.payloadHash,
      encryptionKeyVersion: input.encryptionKeyVersion,
      pricingReleaseId: input.pricingReleaseId ?? undefined,
      supportItemCodes: input.supportItemCodes,
      totalCents: input.totalCents,
      currency: input.currency,
      fundingRoute: input.fundingRoute ?? undefined,
      createdById: input.createdById,
      privacyReviewRequired: input.privacyReviewRequired ?? false,
    },
  });
}

export async function findClaimSnapshotById(id: string) {
  return prisma.ndisClaimSnapshot.findUnique({ where: { id } });
}

export async function listClaimSnapshotsForSource(params: {
  sourceType: Prisma.EnumNdisClaimSourceTypeFilter["equals"];
  sourceId: string;
  organisationId: string;
}) {
  return prisma.ndisClaimSnapshot.findMany({
    where: {
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      organisationId: params.organisationId,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      organisationId: true,
      participantId: true,
      sourceType: true,
      sourceId: true,
      schemaVersion: true,
      maskedPayloadJson: true,
      payloadHash: true,
      encryptionKeyVersion: true,
      supportItemCodes: true,
      totalCents: true,
      currency: true,
      fundingRoute: true,
      createdById: true,
      createdAt: true,
      supersededAt: true,
      supersededById: true,
      privacyReviewRequired: true,
      // encryptedPayloadCiphertext intentionally omitted from list/select helpers
    },
  });
}

export async function markSnapshotSuperseded(params: {
  snapshotId: string;
  supersededById: string;
}): Promise<NdisClaimSnapshot> {
  return prisma.ndisClaimSnapshot.update({
    where: { id: params.snapshotId },
    data: {
      supersededAt: new Date(),
      supersededById: params.supersededById,
    },
  });
}

/** Public DTO — never includes encrypted ciphertext. */
export function toSafeSnapshotDto(snapshot: {
  id: string;
  organisationId: string;
  participantId: string | null;
  sourceType: string;
  sourceId: string;
  schemaVersion: string;
  maskedPayloadJson: unknown;
  payloadHash: string;
  supportItemCodes: string[];
  totalCents: number;
  currency: string;
  fundingRoute: string | null;
  createdById: string;
  createdAt: Date;
  supersededAt: Date | null;
  supersededById: string | null;
  privacyReviewRequired: boolean;
  encryptionKeyVersion?: string;
}) {
  return {
    id: snapshot.id,
    organisationId: snapshot.organisationId,
    participantId: snapshot.participantId,
    sourceType: snapshot.sourceType,
    sourceId: snapshot.sourceId,
    schemaVersion: snapshot.schemaVersion,
    maskedPayloadJson: snapshot.maskedPayloadJson,
    payloadHash: snapshot.payloadHash,
    supportItemCodes: snapshot.supportItemCodes,
    totalCents: snapshot.totalCents,
    currency: snapshot.currency,
    fundingRoute: snapshot.fundingRoute,
    createdById: snapshot.createdById,
    createdAt: snapshot.createdAt,
    supersededAt: snapshot.supersededAt,
    supersededById: snapshot.supersededById,
    privacyReviewRequired: snapshot.privacyReviewRequired,
  };
}
